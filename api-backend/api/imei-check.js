export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const IMEICHECK_API = {
        baseUrl: 'https://api.imeicheck.net',
        apiKey: 'kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f'
    };

    try {
        const { imei, mode = 'full' } = req.body || {};

        if (!imei || !/^\d{15}$/.test(imei)) {
            return res.status(400).json({ error: 'Invalid IMEI' });
        }

        console.log(`Checking IMEI: ${imei}`);

        const serviceId = mode === 'basic' ? 1 : 12;
        
        const orderResponse = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${IMEICHECK_API.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ deviceId: imei, serviceId: serviceId })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            return res.status(400).json({ error: orderData.message || 'API Error' });
        }

        // Poll for result
        const checkId = orderData.id;
        let result = null;
        
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            
            const checkResponse = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks/${checkId}`, {
                headers: { 'Authorization': `Bearer ${IMEICHECK_API.apiKey}` }
            });
            
            const checkData = await checkResponse.json();
            
            if (['done', 'completed', 'successful'].includes(checkData.status)) {
                result = checkData;
                break;
            }
            
            if (['failed', 'error'].includes(checkData.status)) {
                return res.status(400).json({ error: 'Check failed' });
            }
        }

        if (!result) {
            return res.status(408).json({ error: 'Timeout' });
        }

        const props = result.properties || result.result || result || {};
        const modelName = props.deviceName || props.modelName || props.model || 'Unknown';
        
        const response = {
            success: true,
            imei: imei,
            device: {
                brand: modelName.toLowerCase().includes('iphone') ? 'Apple' : 'Unknown',
                model: modelName,
                serial: props.serialNumber || null,
                storage: props.capacity || null,
                color: props.color || null
            },
            network: {
                carrier: props.carrier || props.network || 'Unknown',
                simLock: parseVal(props.simLock),
                country: props.country || null
            },
            security: {
                blacklist: parseBlacklist(props.blacklistStatus || props.blacklisted),
                findMy: parseOnOff(props.fmi || props.findMyiPhone),
                activationLock: parseOnOff(props.activationLock),
                mdm: parseOnOff(props.mdmLock)
            },
            warranty: {
                status: props.warrantyStatus || 'Unknown'
            },
            _raw: props
        };

        // AI Analysis
        let fraudScore = 0, flags = [];
        if (response.security.blacklist === 'Blacklisted') { fraudScore += 50; flags.push('Blacklisted'); }
        if (response.security.activationLock === 'ON') { fraudScore += 35; flags.push('Activation Lock ON'); }
        if (response.security.findMy === 'ON') { fraudScore += 10; flags.push('Find My ON'); }
        if (response.security.mdm === 'ON') { fraudScore += 25; flags.push('MDM detected'); }
        if (response.network.simLock === 'Locked') { fraudScore += 5; flags.push('Carrier locked'); }

        response.ai = {
            fraudScore,
            trustScore: Math.max(0, 100 - fraudScore),
            flags,
            overallStatus: fraudScore >= 40 ? 'flagged' : (fraudScore >= 15 ? 'warning' : 'clean'),
            summary: fraudScore === 0 ? 'Device is clean. Safe to purchase.' : `Issues: ${flags.join(', ')}`
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

function parseVal(v) {
    if (!v) return 'Unknown';
    const s = String(v).toLowerCase();
    if (['unlocked', 'false', 'no'].includes(s)) return 'Unlocked';
    if (['locked', 'true', 'yes'].includes(s)) return 'Locked';
    return v;
}

function parseBlacklist(v) {
    if (!v) return 'Unknown';
    const s = String(v).toLowerCase();
    if (['clean', 'false', 'no'].includes(s)) return 'Clean';
    if (['blacklisted', 'true', 'yes'].includes(s)) return 'Blacklisted';
    return v;
}

function parseOnOff(v) {
    if (!v) return 'Unknown';
    const s = String(v).toLowerCase();
    if (['off', 'false', 'no', 'disabled'].includes(s)) return 'OFF';
    if (['on', 'true', 'yes', 'enabled'].includes(s)) return 'ON';
    return v;
}

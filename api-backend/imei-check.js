/**
 * Fixology IMEI Check API - Vercel Serverless Function
 * Connects to IMEICheck.net for real device verification
 */

const IMEICHECK_API = {
    baseUrl: 'https://api.imeicheck.net',
    apiKey: 'kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f'
};

export default async function handler(req, res) {
    // CORS - Allow all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { imei, mode = 'full' } = req.body || {};

        if (!imei || !/^\d{15}$/.test(imei)) {
            return res.status(400).json({ 
                error: 'Invalid IMEI', 
                message: 'Please provide a valid 15-digit IMEI number' 
            });
        }

        console.log(`[Fixology] Checking IMEI: ${imei}`);

        // Call IMEICheck.net API
        const serviceId = mode === 'basic' ? 1 : 12;
        
        const orderResponse = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${IMEICHECK_API.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                deviceId: imei,
                serviceId: serviceId
            })
        });

        const orderData = await orderResponse.json();
        console.log('[IMEICheck] Order response:', orderData);

        if (!orderResponse.ok) {
            return res.status(400).json({ 
                error: 'API Error', 
                message: orderData.message || orderData.error || 'Failed to create check'
            });
        }

        // Poll for result
        const checkId = orderData.id;
        let result = null;
        
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            
            const checkResponse = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks/${checkId}`, {
                headers: {
                    'Authorization': `Bearer ${IMEICHECK_API.apiKey}`,
                    'Accept': 'application/json'
                }
            });
            
            const checkData = await checkResponse.json();
            console.log(`[IMEICheck] Poll ${i + 1}:`, checkData.status);
            
            if (checkData.status === 'done' || checkData.status === 'completed' || checkData.status === 'successful') {
                result = checkData;
                break;
            }
            
            if (checkData.status === 'failed' || checkData.status === 'error') {
                return res.status(400).json({ error: 'Check failed', message: checkData.message });
            }
        }

        if (!result) {
            return res.status(408).json({ error: 'Timeout', message: 'Check took too long' });
        }

        // Normalize response
        const props = result.properties || result.result || result || {};
        const modelName = props.deviceName || props.modelName || props.model || 'Unknown';
        
        const normalized = {
            success: true,
            imei: imei,
            checkedAt: new Date().toISOString(),
            device: {
                brand: modelName.toLowerCase().includes('iphone') ? 'Apple' : 'Unknown',
                model: modelName,
                modelNumber: props.modelNumber || null,
                serial: props.serialNumber || null,
                storage: props.capacity || extractStorage(modelName),
                color: props.color || extractColor(modelName)
            },
            network: {
                carrier: props.carrier || props.network || 'Unknown',
                simLock: parseStatus(props.simLock || props.simLockStatus),
                country: props.country || props.soldTo || null
            },
            security: {
                blacklist: parseBlacklist(props.blacklistStatus || props.blacklisted),
                findMy: parseOnOff(props.fmi || props.findMyiPhone),
                activationLock: parseOnOff(props.activationLock),
                mdm: parseOnOff(props.mdmLock || props.mdm)
            },
            warranty: {
                status: props.warrantyStatus || 'Unknown',
                coverage: props.coverageType || null
            },
            _raw: props
        };

        // Add AI analysis
        normalized.ai = analyzeDevice(normalized);

        return res.status(200).json(normalized);

    } catch (error) {
        console.error('[Fixology] Error:', error);
        return res.status(500).json({ 
            error: 'Server Error', 
            message: error.message 
        });
    }
}

function parseStatus(val) {
    if (!val) return 'Unknown';
    const v = String(val).toLowerCase();
    if (['unlocked', 'false', 'no', 'off'].includes(v)) return 'Unlocked';
    if (['locked', 'true', 'yes', 'on'].includes(v)) return 'Locked';
    return val;
}

function parseBlacklist(val) {
    if (!val) return 'Unknown';
    const v = String(val).toLowerCase();
    if (['clean', 'false', 'no'].includes(v)) return 'Clean';
    if (['blacklisted', 'true', 'yes'].includes(v)) return 'Blacklisted';
    return val;
}

function parseOnOff(val) {
    if (!val) return 'Unknown';
    const v = String(val).toLowerCase();
    if (['off', 'false', 'no', 'disabled'].includes(v)) return 'OFF';
    if (['on', 'true', 'yes', 'enabled'].includes(v)) return 'ON';
    return val;
}

function extractStorage(text) {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(GB|TB)/i);
    return match ? `${match[1]}${match[2].toUpperCase()}` : null;
}

function extractColor(text) {
    if (!text) return null;
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Purple', 'Pink', 'Red', 'Green', 'Titanium', 'Graphite'];
    for (const c of colors) {
        if (text.toLowerCase().includes(c.toLowerCase())) return c;
    }
    return null;
}

function analyzeDevice(data) {
    let fraudScore = 0;
    let flags = [];
    
    if (data.security.blacklist === 'Blacklisted') {
        fraudScore += 50;
        flags.push('Device is BLACKLISTED');
    }
    if (data.security.activationLock === 'ON') {
        fraudScore += 35;
        flags.push('Activation Lock is ON');
    }
    if (data.security.findMy === 'ON' && data.security.activationLock !== 'ON') {
        fraudScore += 10;
        flags.push('Find My is ON');
    }
    if (data.security.mdm === 'ON') {
        fraudScore += 25;
        flags.push('MDM Lock detected');
    }
    if (data.network.simLock === 'Locked') {
        fraudScore += 5;
        flags.push('Carrier locked');
    }

    const trustScore = Math.max(0, 100 - fraudScore);
    
    let overallStatus = 'clean';
    let summary = 'Device verified clean. Safe to purchase.';
    
    if (fraudScore >= 40) {
        overallStatus = 'flagged';
        summary = `HIGH RISK: ${flags.join(', ')}. Not recommended.`;
    } else if (fraudScore >= 15) {
        overallStatus = 'warning';
        summary = `Caution: ${flags.join(', ')}. Verify before purchase.`;
    }

    return { fraudScore, trustScore, flags, overallStatus, summary };
}

/**
 * Fixology IMEI Check API - Vercel Serverless Function
 * Connects to IMEICheck.net for real device verification
 * 
 * Deploy to Vercel for FREE serverless hosting
 */

// IMEICheck.net Configuration
const IMEICHECK_API = {
    baseUrl: 'https://api.imeicheck.net',
    apiKey: 'kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f'
};

// Service IDs from IMEICheck.net
const SERVICES = {
    // Apple Services
    appleBasicInfo: 1,           // Apple Basic Info (model, color, storage) - FREE or cheap
    appleFMI: 6,                 // Find My iPhone status
    appleCarrierSIMlock: 12,     // Carrier + SIM Lock + Blacklist Bundle
    appleWarranty: 7,            // Warranty status
    
    // Universal Services
    gsmaBlacklist: 2,            // GSMA Blacklist check
    carrierInfo: 1               // Basic carrier info
};

// CORS headers for browser requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// Main handler
export default async function handler(req, res) {
    // Set CORS headers for ALL requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { imei, mode = 'full' } = req.body;

        // Validate IMEI
        if (!imei || !validateIMEI(imei)) {
            return res.status(400).json({ 
                error: 'Invalid IMEI', 
                message: 'Please provide a valid 15-digit IMEI number' 
            });
        }

        console.log(`[Fixology] Checking IMEI: ${imei} (mode: ${mode})`);

        // Determine which service to use
        const serviceId = mode === 'basic' ? SERVICES.carrierInfo : SERVICES.appleCarrierSIMlock;

        // Step 1: Create the check order
        const orderResult = await createCheckOrder(imei, serviceId);
        
        if (!orderResult.success) {
            return res.status(400).json({ 
                error: 'API Error', 
                message: orderResult.error || 'Failed to create check order'
            });
        }

        // Step 2: Get the check result (may need polling for async services)
        const checkResult = await getCheckResult(orderResult.id);

        if (!checkResult.success) {
            return res.status(400).json({ 
                error: 'Check Failed', 
                message: checkResult.error || 'Failed to retrieve check results'
            });
        }

        // Step 3: Normalize and return the data
        const normalizedData = normalizeResponse(checkResult.data, imei, mode);
        
        // Step 4: Add AI analysis
        const finalResult = addAIAnalysis(normalizedData);

        console.log(`[Fixology] Check complete for IMEI: ${imei}`);
        
        return res.status(200).json({
            success: true,
            ...finalResult
        });

    } catch (error) {
        console.error('[Fixology] Error:', error);
        return res.status(500).json({ 
            error: 'Server Error', 
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// Create a check order with IMEICheck.net
async function createCheckOrder(imei, serviceId) {
    try {
        const response = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks`, {
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

        const data = await response.json();

        if (!response.ok) {
            console.error('[IMEICheck] Order error:', data);
            return { 
                success: false, 
                error: data.message || data.error || `HTTP ${response.status}` 
            };
        }

        console.log('[IMEICheck] Order created:', data);

        return {
            success: true,
            id: data.id,
            status: data.status,
            data: data
        };

    } catch (error) {
        console.error('[IMEICheck] Request error:', error);
        return { success: false, error: error.message };
    }
}

// Get check result (with polling for async services)
async function getCheckResult(checkId, maxAttempts = 15) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`${IMEICHECK_API.baseUrl}/v1/checks/${checkId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${IMEICHECK_API.apiKey}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                return { success: false, error: data.message || `HTTP ${response.status}` };
            }

            console.log(`[IMEICheck] Attempt ${attempt}: Status = ${data.status}`);

            // Check if complete
            if (data.status === 'done' || data.status === 'completed' || data.status === 'successful') {
                return { success: true, data: data };
            }

            // Check if failed
            if (data.status === 'failed' || data.status === 'error') {
                return { success: false, error: data.message || 'Check failed' };
            }

            // Still processing - wait and retry
            if (attempt < maxAttempts) {
                await delay(2000); // Wait 2 seconds between attempts
            }

        } catch (error) {
            console.error(`[IMEICheck] Polling error (attempt ${attempt}):`, error);
            if (attempt >= maxAttempts) {
                return { success: false, error: error.message };
            }
            await delay(2000);
        }
    }

    return { success: false, error: 'Timeout waiting for results' };
}

// Normalize the API response to our standard format
function normalizeResponse(apiData, imei, mode) {
    // Extract properties from various possible response formats
    const props = apiData.properties || apiData.result || apiData.data || apiData || {};
    
    // Helper to get nested value
    const get = (obj, path, defaultVal = null) => {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultVal;
            }
        }
        return result || defaultVal;
    };

    // Detect brand from model name
    const modelName = get(props, 'deviceName') || get(props, 'modelName') || get(props, 'model') || '';
    const brand = detectBrand(modelName);

    // Parse SIM lock status
    const simLockRaw = get(props, 'simLock') || get(props, 'simLockStatus') || get(props, 'locked');
    const simLock = parseSimLock(simLockRaw);

    // Parse blacklist status
    const blacklistRaw = get(props, 'blacklistStatus') || get(props, 'blacklisted') || get(props, 'gsmaBlacklisted');
    const blacklist = parseBlacklist(blacklistRaw);

    // Parse Find My iPhone status
    const fmiRaw = get(props, 'fmi') || get(props, 'findMyiPhone') || get(props, 'findMy') || get(props, 'fmiOn');
    const findMy = parseFMI(fmiRaw);

    // Parse Activation Lock
    const actLockRaw = get(props, 'activationLock') || get(props, 'icloudLock');
    const activationLock = parseOnOff(actLockRaw);

    // Parse MDM
    const mdmRaw = get(props, 'mdmLock') || get(props, 'mdm') || get(props, 'mdmStatus');
    const mdm = parseOnOff(mdmRaw);

    return {
        imei: imei,
        mode: mode,
        checkedAt: new Date().toISOString(),
        cached: false,
        
        device: {
            brand: brand,
            model: modelName || 'Unknown Model',
            modelNumber: get(props, 'modelNumber') || get(props, 'model') || null,
            serial: get(props, 'serialNumber') || get(props, 'serial') || null,
            storage: extractStorage(modelName) || get(props, 'capacity') || get(props, 'storage') || null,
            color: get(props, 'color') || get(props, 'colour') || extractColor(modelName) || null,
            imei2: get(props, 'imei2') || null
        },
        
        network: {
            carrier: get(props, 'carrier') || get(props, 'network') || get(props, 'carrierName') || 'Unknown',
            simLock: simLock,
            type: get(props, 'networkType') || 'GSM/LTE',
            country: get(props, 'country') || get(props, 'countryName') || get(props, 'soldTo') || null
        },
        
        security: {
            blacklist: blacklist,
            blacklistReason: blacklist === 'Blacklisted' ? (get(props, 'blacklistReason') || 'Reported Lost/Stolen') : null,
            findMy: findMy,
            activationLock: activationLock,
            mdm: mdm,
            replaced: parseOnOff(get(props, 'replaced')) || 'Unknown',
            refurbished: parseOnOff(get(props, 'refurbished')) || 'Unknown'
        },
        
        origin: {
            manufactureDate: get(props, 'estManufactureDate') || get(props, 'manufactureDate') || null,
            age: calculateAge(get(props, 'estManufactureDate')),
            factory: get(props, 'assembledIn') || get(props, 'factory') || null,
            region: get(props, 'soldBy') || get(props, 'region') || get(props, 'country') || null
        },
        
        warranty: {
            status: parseWarranty(get(props, 'warrantyStatus') || get(props, 'warranty')),
            purchaseDate: get(props, 'purchaseDate') || get(props, 'dateOfPurchase') || null,
            coverageType: get(props, 'coverageType') || get(props, 'appleCare') || null,
            expiration: get(props, 'warrantyExpiration') || get(props, 'coverageExpiration') || null,
            telephone: parseOnOff(get(props, 'telephoneSupport')) || null,
            repairs: parseOnOff(get(props, 'repairCoverage')) || null
        },

        // Raw data for debugging
        _raw: props
    };
}

// Add AI-powered fraud analysis
function addAIAnalysis(result) {
    const sec = result.security;
    const net = result.network;
    
    let fraudScore = 0;
    let flags = [];
    let recommendations = [];

    // Blacklist check (most critical)
    if (sec.blacklist === 'Blacklisted') {
        fraudScore += 50;
        flags.push('🚨 Device is BLACKLISTED (reported lost/stolen)');
        recommendations.push('DO NOT purchase - device may be stolen');
    }

    // Activation Lock (very serious)
    if (sec.activationLock === 'ON') {
        fraudScore += 35;
        flags.push('🔒 iCloud Activation Lock is ON');
        recommendations.push('Device cannot be activated without original owner');
    }

    // Find My iPhone (caution)
    if (sec.findMy === 'ON') {
        if (sec.activationLock !== 'ON') {
            fraudScore += 10;
            flags.push('📍 Find My iPhone is ON (but no Activation Lock)');
            recommendations.push('Ask seller to disable Find My before purchase');
        }
    }

    // MDM Lock (corporate device)
    if (sec.mdm === 'ON') {
        fraudScore += 25;
        flags.push('🏢 MDM Profile detected (corporate/school device)');
        recommendations.push('May require organization to remove MDM');
    }

    // SIM Lock (minor issue)
    if (net.simLock === 'Locked') {
        fraudScore += 5;
        flags.push('📶 Device is carrier locked');
        recommendations.push('May need carrier unlock for full use');
    }

    // Replaced device
    if (sec.replaced === 'Yes' || sec.replaced === 'ON') {
        fraudScore += 10;
        flags.push('🔄 Device has been replaced by Apple');
    }

    // Refurbished
    if (sec.refurbished === 'Yes' || sec.refurbished === 'ON') {
        fraudScore += 5;
        flags.push('♻️ Device is refurbished');
    }

    // Calculate trust score
    const trustScore = Math.max(0, 100 - fraudScore);

    // Determine overall status
    let overallStatus, statusMessage;
    if (fraudScore === 0) {
        overallStatus = 'clean';
        statusMessage = '✅ Device is CLEAN - Safe to purchase';
    } else if (fraudScore < 15) {
        overallStatus = 'clean';
        statusMessage = '✅ Device appears safe with minor notes';
    } else if (fraudScore < 40) {
        overallStatus = 'warning';
        statusMessage = '⚠️ CAUTION - Review flags before purchasing';
    } else {
        overallStatus = 'flagged';
        statusMessage = '🚨 HIGH RISK - Not recommended for purchase';
    }

    // Refurb likelihood
    let refurbLikelihood;
    if (sec.refurbished === 'Yes' || sec.replaced === 'Yes') {
        refurbLikelihood = 'Confirmed';
    } else if (fraudScore < 10) {
        refurbLikelihood = 'Low';
    } else if (fraudScore < 30) {
        refurbLikelihood = 'Medium';
    } else {
        refurbLikelihood = 'High';
    }

    // Generate summary
    let summary;
    if (flags.length === 0) {
        summary = `Device verified clean. ${sec.findMy} Find My, ${sec.mdm} MDM, ${net.simLock} carrier. This ${result.device.brand} appears to be original with no fraud indicators. Safe to purchase.`;
    } else if (fraudScore < 40) {
        summary = `Device has ${flags.length} flag(s): ${flags.map(f => f.replace(/[🚨🔒📍🏢📶🔄♻️]/g, '').trim()).join(', ')}. Proceed with caution and verify with seller.`;
    } else {
        summary = `⚠️ HIGH RISK DEVICE with ${flags.length} serious flag(s). ${flags[0]}. We do not recommend purchasing this device.`;
    }

    result.ai = {
        fraudScore,
        trustScore,
        refurbLikelihood,
        overallStatus,
        statusMessage,
        flags,
        recommendations,
        summary
    };

    return result;
}

// ============ Helper Functions ============

function validateIMEI(imei) {
    if (!imei || typeof imei !== 'string') return false;
    const cleaned = imei.replace(/\D/g, '');
    if (cleaned.length !== 15) return false;
    
    // Luhn algorithm check
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        let d = parseInt(cleaned[i]);
        if (i % 2 === 1) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
    }
    return sum % 10 === 0;
}

function detectBrand(model) {
    if (!model) return 'Unknown';
    const m = model.toLowerCase();
    if (m.includes('iphone') || m.includes('ipad') || m.includes('apple') || m.includes('watch')) return 'Apple';
    if (m.includes('samsung') || m.includes('galaxy')) return 'Samsung';
    if (m.includes('pixel')) return 'Google';
    if (m.includes('oneplus')) return 'OnePlus';
    if (m.includes('huawei')) return 'Huawei';
    if (m.includes('xiaomi') || m.includes('redmi')) return 'Xiaomi';
    if (m.includes('oppo')) return 'OPPO';
    if (m.includes('vivo')) return 'Vivo';
    if (m.includes('motorola') || m.includes('moto')) return 'Motorola';
    if (m.includes('lg')) return 'LG';
    return 'Unknown';
}

function extractStorage(text) {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(GB|TB)/i);
    return match ? `${match[1]}${match[2].toUpperCase()}` : null;
}

function extractColor(text) {
    if (!text) return null;
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Purple', 'Pink', 'Red', 'Green', 'Titanium', 'Graphite', 'Pacific Blue', 'Sierra Blue', 'Alpine Green', 'Deep Purple', 'Space Gray', 'Midnight', 'Starlight'];
    for (const c of colors) {
        if (text.toLowerCase().includes(c.toLowerCase())) return c;
    }
    return null;
}

function parseSimLock(value) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['unlocked', 'unlock', 'false', 'no', 'off', '0'].includes(v)) return 'Unlocked';
    if (['locked', 'lock', 'true', 'yes', 'on', '1'].includes(v)) return 'Locked';
    return String(value);
}

function parseBlacklist(value) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['clean', 'false', 'no', 'off', '0', 'not blacklisted'].includes(v)) return 'Clean';
    if (['blacklisted', 'true', 'yes', 'on', '1', 'blocked'].includes(v)) return 'Blacklisted';
    return String(value);
}

function parseFMI(value) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['off', 'false', 'no', '0', 'disabled'].includes(v)) return 'OFF';
    if (['on', 'true', 'yes', '1', 'enabled'].includes(v)) return 'ON';
    return String(value);
}

function parseOnOff(value) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['off', 'false', 'no', '0', 'disabled', 'none'].includes(v)) return 'OFF';
    if (['on', 'true', 'yes', '1', 'enabled', 'active'].includes(v)) return 'ON';
    return String(value);
}

function parseWarranty(value) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['active', 'valid', 'yes', 'true', 'covered'].includes(v)) return 'Active';
    if (['expired', 'invalid', 'no', 'false', 'out of warranty'].includes(v)) return 'Expired';
    return String(value);
}

function calculateAge(dateStr) {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years > 0) {
            return `${years}y ${remainingMonths}m`;
        }
        return `${remainingMonths}m`;
    } catch {
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

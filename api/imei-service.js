/**
 * Fixology IMEI Backend Service v2.0
 * Production Node.js API for IMEICheck.net integration
 * 
 * Features:
 * - Multi-service auto-merging
 * - Smart 24h caching (Redis-ready)
 * - Fallback API support
 * - Rate limiting
 * - Subscription/credits validation
 * - HMAC request signing
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    port: process.env.PORT || 3001,
    
    // Primary API: IMEICheck.net
    imeicheck: {
        baseUrl: 'https://api.imeicheck.net',
        apiKey: process.env.IMEICHECK_API_KEY || 'kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f',
        version: 'v1'
    },
    
    // Fallback APIs
    fallbackApis: [
        { name: 'IMEIInfo', baseUrl: 'https://api.imei.info', apiKey: process.env.IMEIINFO_API_KEY, enabled: false },
        { name: 'Zyla', baseUrl: 'https://zylalabs.com/api', apiKey: process.env.ZYLA_API_KEY, enabled: false }
    ],
    
    // Service IDs for IMEICheck.net
    services: {
        appleBasicInfo: { id: 5, name: 'Apple Basic Info', price: 0 },
        carrierSimLock: { id: 1, name: 'Carrier + SIM Lock', price: 0.08 },
        findMyStatus: { id: 6, name: 'Find My Status', price: 0.10 },
        blacklistGSMA: { id: 2, name: 'GSMA Blacklist', price: 0.12 },
        warrantyCheck: { id: 7, name: 'Warranty Check', price: 0.08 },
        fullBundle: { id: 12, name: 'Full Bundle (Carrier+SIM+Blacklist)', price: 0.13 }
    },
    
    // Subscription Plans
    plans: {
        basic: { id: 'basic', name: 'Basic', price: 29, credits: 100 },
        pro: { id: 'pro', name: 'Pro', price: 79, credits: 400 },
        enterprise: { id: 'enterprise', name: 'Enterprise', price: 199, credits: -1 } // -1 = unlimited
    },
    
    // Rate Limiting
    rateLimit: {
        windowMs: 60000,
        maxPerWindow: 5
    },
    
    // Caching
    cache: {
        ttlMs: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORES (Replace with Redis in production)
// ═══════════════════════════════════════════════════════════════════════════

const cache = new Map();
const rateLimits = new Map();
const subscriptions = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS APP
// ═══════════════════════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Rate Limiter
function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - CONFIG.rateLimit.windowMs;
    
    let requests = rateLimits.get(ip) || [];
    requests = requests.filter(t => t > windowStart);
    
    if (requests.length >= CONFIG.rateLimit.maxPerWindow) {
        return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: Math.ceil((requests[0] + CONFIG.rateLimit.windowMs - now) / 1000) });
    }
    
    requests.push(now);
    rateLimits.set(ip, requests);
    next();
}

// HMAC Signature Verification (optional)
function verifySignature(req, res, next) {
    const signature = req.headers['x-fixology-signature'];
    const timestamp = req.headers['x-fixology-timestamp'];
    
    // Skip in development
    if (process.env.NODE_ENV !== 'production' || !signature) {
        return next();
    }
    
    const payload = `${timestamp}.${JSON.stringify(req.body)}`;
    const expectedSig = crypto.createHmac('sha256', process.env.HMAC_SECRET || 'fixology-secret').update(payload).digest('hex');
    
    if (signature !== expectedSig) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Fixology IMEI API v2.0', timestamp: new Date().toISOString() });
});

// IMEI Check Endpoint
app.post('/api/imei/check', rateLimiter, verifySignature, async (req, res) => {
    try {
        const { imei, mode = 'full', shopId } = req.body;
        
        // Validate IMEI
        if (!validateIMEI(imei)) {
            return res.status(400).json({ error: 'Invalid IMEI format' });
        }
        
        // Check subscription/credits (skip for demo)
        if (shopId) {
            const sub = subscriptions.get(shopId);
            if (sub && sub.credits !== -1 && sub.creditsUsed >= sub.credits) {
                return res.status(402).json({ error: 'Credit limit exceeded', upgradeUrl: '/pricing' });
            }
        }
        
        // Check cache first
        const cacheKey = `${imei}:${mode}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.cache.ttlMs) {
            return res.json({ ...cached.data, cached: true, creditsCharged: 0 });
        }
        
        // Run IMEI check
        let result;
        try {
            result = await runIMEICheck(imei, mode);
        } catch (apiError) {
            // Try fallback APIs
            for (const fallback of CONFIG.fallbackApis.filter(f => f.enabled)) {
                try {
                    result = await runFallbackCheck(fallback, imei);
                    break;
                } catch (fallbackError) {
                    console.error(`Fallback ${fallback.name} failed:`, fallbackError.message);
                }
            }
            
            if (!result) {
                throw new Error('All API providers failed');
            }
        }
        
        // Add AI analysis
        result = addAIAnalysis(result);
        
        // Cache result
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        // Deduct credit (if not cached)
        if (shopId && mode === 'full') {
            const sub = subscriptions.get(shopId);
            if (sub) sub.creditsUsed++;
        }
        
        res.json({ ...result, cached: false, creditsCharged: mode === 'full' ? 1 : 0 });
        
    } catch (error) {
        console.error('IMEI Check Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Get Account Balance
app.get('/api/account/balance', async (req, res) => {
    try {
        const response = await fetch(`${CONFIG.imeicheck.baseUrl}/${CONFIG.imeicheck.version}/account`, {
            headers: { 'Authorization': `Bearer ${CONFIG.imeicheck.apiKey}` }
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Available Services
app.get('/api/services', (req, res) => {
    res.json(CONFIG.services);
});

// Get Subscription Plans
app.get('/api/plans', (req, res) => {
    res.json(CONFIG.plans);
});

// Shop Subscription Status
app.get('/api/shop/:shopId/subscription', (req, res) => {
    const sub = subscriptions.get(req.params.shopId) || { plan: 'basic', credits: 100, creditsUsed: 0 };
    res.json(sub);
});

// ═══════════════════════════════════════════════════════════════════════════
// IMEI CHECK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function runIMEICheck(imei, mode) {
    const serviceId = mode === 'full' ? CONFIG.services.fullBundle.id : CONFIG.services.carrierSimLock.id;
    
    const response = await fetch(`${CONFIG.imeicheck.baseUrl}/${CONFIG.imeicheck.version}/checks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.imeicheck.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceId: imei, serviceId })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Poll if async
    if (result.status === 'pending' || result.status === 'processing') {
        return await pollForResult(result.id);
    }
    
    return normalizeResponse(result, imei, mode);
}

async function pollForResult(checkId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        await delay(2000);
        
        const response = await fetch(`${CONFIG.imeicheck.baseUrl}/${CONFIG.imeicheck.version}/checks/${checkId}`, {
            headers: { 'Authorization': `Bearer ${CONFIG.imeicheck.apiKey}` }
        });
        
        const result = await response.json();
        
        if (result.status === 'completed' || result.status === 'done') {
            return normalizeResponse(result, result.deviceId, 'full');
        }
        
        if (result.status === 'failed' || result.status === 'error') {
            throw new Error(result.message || 'Check failed');
        }
    }
    
    throw new Error('Timeout waiting for results');
}

async function runFallbackCheck(api, imei) {
    // Implement fallback API logic here
    throw new Error('Fallback not implemented');
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA NORMALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function normalizeResponse(apiResponse, imei, mode) {
    const r = apiResponse.result || apiResponse.properties || apiResponse;
    
    return {
        imei: r.imei || imei,
        mode,
        checkedAt: new Date().toISOString(),
        device: {
            brand: r.brand || detectBrand(r.modelName),
            model: r.modelName || r.model || 'Unknown',
            modelNumber: r.modelNumber || null,
            serial: r.serialNumber || r.serial || null,
            storage: extractStorage(r.modelName) || r.storage || null,
            color: extractColor(r.modelName) || r.color || null
        },
        network: {
            carrier: r.carrier || r.network || null,
            simLock: normalizeStatus(r.simLock || r.simLockStatus, ['Unlocked', 'Locked']),
            type: r.networkType || 'GSM/LTE',
            country: r.country || null
        },
        security: {
            blacklist: normalizeStatus(r.blacklistStatus || r.blacklist, ['Clean', 'Blacklisted']),
            blacklistReason: r.blacklistReason || null,
            findMy: normalizeStatus(r.findMyiPhone || r.fmi, ['OFF', 'ON']),
            activationLock: normalizeStatus(r.activationLock, ['OFF', 'ON']),
            mdm: normalizeStatus(r.mdmLock || r.mdm, ['OFF', 'ON'])
        },
        origin: {
            manufactureDate: r.manufactureDate || r.estManufactureDate || null,
            factory: r.factory || r.assembledIn || null,
            region: r.soldByRegion || r.country || null
        },
        warranty: {
            status: normalizeStatus(r.warrantyStatus || r.warranty, ['Active', 'Expired']),
            purchaseDate: r.purchaseDate || r.dateOfPurchase || null,
            coverageType: r.coverageType || r.appleCareStatus || null,
            expiration: r.coverageExpiration || null
        }
    };
}

function detectBrand(model) {
    if (!model) return 'Unknown';
    const m = model.toLowerCase();
    if (m.includes('iphone') || m.includes('ipad') || m.includes('apple')) return 'Apple';
    if (m.includes('samsung') || m.includes('galaxy')) return 'Samsung';
    if (m.includes('pixel')) return 'Google';
    return 'Unknown';
}

function extractStorage(text) {
    if (!text) return null;
    const match = text.match(/(\d+)\s*(GB|TB)/i);
    return match ? `${match[1]}${match[2].toUpperCase()}` : null;
}

function extractColor(text) {
    if (!text) return null;
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Purple', 'Pink', 'Titanium'];
    for (const c of colors) {
        if (text.toLowerCase().includes(c.toLowerCase())) return c;
    }
    return null;
}

function normalizeStatus(value, options) {
    if (!value) return 'Unknown';
    const v = String(value).toLowerCase();
    if (['unlock', 'unlocked', 'off', 'clean', 'no', 'false'].includes(v)) return options[0];
    if (['lock', 'locked', 'on', 'blacklisted', 'yes', 'true'].includes(v)) return options[1];
    return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

function addAIAnalysis(result) {
    const sec = result.security;
    let fraudScore = 0, flags = [];
    
    if (sec.blacklist === 'Blacklisted') { fraudScore += 50; flags.push('Device blacklisted'); }
    if (sec.activationLock === 'ON') { fraudScore += 30; flags.push('Activation Lock ON'); }
    if (sec.findMy === 'ON' && sec.activationLock === 'OFF') { fraudScore += 10; flags.push('Find My ON'); }
    if (sec.mdm === 'ON') { fraudScore += 20; flags.push('MDM profile'); }
    
    const trustScore = Math.max(0, 100 - fraudScore);
    const refurbLikelihood = fraudScore < 15 ? 'Low' : (fraudScore < 40 ? 'Medium' : 'High');
    
    let summary = fraudScore < 15 
        ? `Device appears original. No fraud indicators detected. Safe to purchase.`
        : fraudScore < 40 
        ? `Caution: ${flags.join(', ')}. Verify with seller.`
        : `High risk: ${flags.join(', ')}. Not recommended.`;
    
    result.ai = { fraudScore, trustScore, refurbLikelihood, flags, summary, overallStatus: fraudScore < 15 ? 'clean' : (fraudScore < 40 ? 'warning' : 'flagged') };
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function validateIMEI(imei) {
    if (!imei || imei.length !== 15 || !/^\d{15}$/.test(imei)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        let d = parseInt(imei[i]);
        if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
    }
    return sum % 10 === 0;
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(CONFIG.port, () => {
    console.log(`🚀 Fixology IMEI API v2.0 running on port ${CONFIG.port}`);
    console.log(`📡 Primary API: IMEICheck.net`);
    console.log(`💾 Cache TTL: ${CONFIG.cache.ttlMs / 3600000} hours`);
});

module.exports = app;

/**
 * Fixology IMEI Check API v1.0
 * Vercel Serverless Function
 * 
 * Endpoint: POST /api/imei-check
 * Body: { "imei": "353456789012345" }
 */

// CORS: Set to '*' for testing, then lock down to specific origins
const ALLOWED_ORIGINS = [
  'https://fixologyai.com',
  'https://www.fixologyai.com',
  'https://final-oc9r.vercel.app',
  'http://localhost:3000'
];

function setCors(res, origin) {
  // For testing, use '*'. For production, validate origin.
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  const corsOrigin = isAllowed ? (origin || '*') : ALLOWED_ORIGINS[0];
  
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const safeData = { ...data };
  // Never log API keys
  delete safeData.apiKey;
  delete safeData.authorization;
  console.log(JSON.stringify({ timestamp, level, message, ...safeData }));
}

function normalizeImeiResult(raw) {
  if (!raw) return null;
  
  const props = raw.properties || raw.result || raw.data || raw;
  
  // Extract model info
  const modelName = props.deviceName || props.modelName || props.model || props.name || 'Unknown Device';
  
  // Detect brand
  let brand = 'Unknown';
  const modelLower = modelName.toLowerCase();
  if (modelLower.includes('iphone') || modelLower.includes('ipad') || modelLower.includes('apple')) {
    brand = 'Apple';
  } else if (modelLower.includes('samsung') || modelLower.includes('galaxy')) {
    brand = 'Samsung';
  } else if (modelLower.includes('pixel')) {
    brand = 'Google';
  }
  
  // Extract storage
  let storage = props.capacity || props.storage || null;
  if (!storage) {
    const storageMatch = modelName.match(/(\d+)\s*(GB|TB)/i);
    if (storageMatch) storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
  }
  
  // Extract color
  let color = props.color || props.colour || null;
  if (!color) {
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Purple', 'Pink', 'Red', 'Green', 'Titanium', 'Graphite', 'Midnight', 'Starlight'];
    for (const c of colors) {
      if (modelName.toLowerCase().includes(c.toLowerCase())) {
        color = c;
        break;
      }
    }
  }
  
  // Parse boolean/status fields
  const parseStatus = (val, trueVal, falseVal) => {
    if (val === undefined || val === null) return 'Unknown';
    const v = String(val).toLowerCase();
    if (['true', 'yes', 'on', '1', 'locked', 'blacklisted', 'active'].includes(v)) return trueVal;
    if (['false', 'no', 'off', '0', 'unlocked', 'clean', 'inactive', 'expired'].includes(v)) return falseVal;
    return String(val);
  };
  
  // SIM Lock
  const simLockRaw = props.simLock || props.simLockStatus || props.carrierLock || props.locked;
  const simLock = parseStatus(simLockRaw, 'Locked', 'Unlocked');
  
  // Blacklist
  const blacklistRaw = props.blacklistStatus || props.blacklisted || props.blacklist || props.gsmaBlacklisted;
  const blacklist = parseStatus(blacklistRaw, 'Blacklisted', 'Clean');
  
  // Find My iPhone
  const fmiRaw = props.fmi || props.findMyiPhone || props.findMy || props.fmiOn;
  const findMy = parseStatus(fmiRaw, 'ON', 'OFF');
  
  // Activation Lock
  const actLockRaw = props.activationLock || props.icloudLock || props.iCloudStatus;
  const activationLock = parseStatus(actLockRaw, 'ON', 'OFF');
  
  // MDM
  const mdmRaw = props.mdmLock || props.mdm || props.mdmStatus;
  const mdm = parseStatus(mdmRaw, 'ON', 'OFF');
  
  // Warranty
  const warrantyRaw = props.warrantyStatus || props.warranty || props.coverageStatus;
  const warranty = parseStatus(warrantyRaw, 'Active', 'Expired');
  const warrantyExpiry = props.warrantyExpiration || props.coverageExpiration || props.warrantyEndDate || null;
  
  // Carrier
  const carrier = props.carrier || props.network || props.carrierName || props.originalCarrier || 'Unknown';
  
  // Country
  const country = props.country || props.countryName || props.soldTo || props.purchaseCountry || null;
  
  // Serial
  const serial = props.serialNumber || props.serial || props.sn || null;
  
  // Model number
  const modelNumber = props.modelNumber || props.modelNum || null;
  
  // IMEI2
  const imei2 = props.imei2 || props.secondImei || null;
  
  // Replaced/Refurbished
  const replaced = parseStatus(props.replaced || props.replacement, 'Yes', 'No');
  const refurbished = parseStatus(props.refurbished || props.isRefurbished, 'Yes', 'No');
  
  return {
    model: modelName,
    brand,
    storage,
    color,
    serial,
    modelNumber,
    imei2,
    carrier,
    country,
    simLock,
    blacklist,
    blacklistReason: blacklist === 'Blacklisted' ? (props.blacklistReason || 'Reported Lost/Stolen') : null,
    findMy,
    activationLock,
    mdm,
    warranty,
    warrantyExpiry,
    replaced,
    refurbished
  };
}

function calculateFraudScore(summary) {
  let score = 0;
  const flags = [];
  const recommendations = [];
  
  if (summary.blacklist === 'Blacklisted') {
    score += 50;
    flags.push('Device is BLACKLISTED (reported lost/stolen)');
    recommendations.push('DO NOT purchase this device');
  }
  
  if (summary.activationLock === 'ON') {
    score += 35;
    flags.push('iCloud Activation Lock is ON');
    recommendations.push('Device cannot be activated without original owner credentials');
  }
  
  if (summary.findMy === 'ON' && summary.activationLock !== 'ON') {
    score += 10;
    flags.push('Find My iPhone is enabled');
    recommendations.push('Ask seller to disable Find My before purchase');
  }
  
  if (summary.mdm === 'ON') {
    score += 25;
    flags.push('MDM profile detected (corporate/school device)');
    recommendations.push('May require organization to remove MDM lock');
  }
  
  if (summary.simLock === 'Locked') {
    score += 5;
    flags.push('Device is carrier locked');
    recommendations.push('May need carrier unlock for use on other networks');
  }
  
  if (summary.replaced === 'Yes') {
    score += 5;
    flags.push('Device has been replaced by manufacturer');
  }
  
  if (summary.refurbished === 'Yes') {
    score += 3;
    flags.push('Device is refurbished');
  }
  
  const trustScore = Math.max(0, 100 - score);
  
  let overallStatus, statusMessage;
  if (score === 0) {
    overallStatus = 'clean';
    statusMessage = 'Device is CLEAN — Safe to purchase';
  } else if (score < 15) {
    overallStatus = 'clean';
    statusMessage = 'Device appears safe with minor notes';
  } else if (score < 40) {
    overallStatus = 'warning';
    statusMessage = 'CAUTION — Review flags before purchasing';
  } else {
    overallStatus = 'flagged';
    statusMessage = 'HIGH RISK — Not recommended for purchase';
  }
  
  return {
    fraudScore: score,
    trustScore,
    overallStatus,
    statusMessage,
    flags,
    recommendations
  };
}

module.exports = async (req, res) => {
  const startTime = Date.now();
  
  // Set CORS headers immediately
  setCors(res, req.headers.origin);
  
  // Log incoming request (no sensitive data)
  log('info', 'Incoming request', {
    method: req.method,
    path: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    log('info', 'Preflight request - returning 200');
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    log('warn', 'Method not allowed', { method: req.method });
    res.statusCode = 405;
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.json({ 
      success: false, 
      status: 'error',
      reason: 'Method Not Allowed. Use POST.',
      rawStatus: 405
    });
  }
  
  try {
    // Check API key
    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      log('error', 'IMEICHECK_API_KEY not configured');
      res.statusCode = 500;
      return res.json({
        success: false,
        status: 'error',
        reason: 'Server configuration error: API key not set',
        rawStatus: 500
      });
    }
    
    // Parse body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
      res.statusCode = 400;
      return res.json({
        success: false,
        status: 'error',
        reason: 'Invalid JSON in request body',
        rawStatus: 400
      });
    }
    
    const imei = body && body.imei;
    
    // Validate IMEI
    if (!imei || typeof imei !== 'string') {
      log('warn', 'Missing IMEI in request');
      res.statusCode = 400;
      return res.json({
        success: false,
        status: 'error',
        reason: 'Missing or invalid "imei" in request body',
        rawStatus: 400
      });
    }
    
    // Clean IMEI (remove spaces, dashes)
    const cleanImei = imei.replace(/[\s\-]/g, '');
    
    // Validate IMEI format (14-17 digits)
    if (!/^\d{14,17}$/.test(cleanImei)) {
      log('warn', 'Invalid IMEI format', { imeiLength: cleanImei.length });
      res.statusCode = 400;
      return res.json({
        success: false,
        status: 'error',
        reason: 'IMEI must be 14-17 digits',
        rawStatus: 400
      });
    }
    
    log('info', 'Starting IMEI check', { imei: cleanImei.substring(0, 8) + '...' });
    
    // Create the check
    const serviceId = 12; // Full check service
    
    let createResp;
    try {
      createResp = await fetch('https://api.imeicheck.net/v1/checks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          deviceId: cleanImei,
          serviceId: serviceId
        })
      });
    } catch (fetchError) {
      log('error', 'Network error calling IMEICheck', { error: fetchError.message });
      res.statusCode = 502;
      return res.json({
        success: false,
        status: 'error',
        reason: 'Failed to connect to IMEI verification service',
        rawStatus: 502
      });
    }
    
    if (!createResp.ok) {
      const errorText = await createResp.text();
      log('error', 'IMEICheck create failed', { 
        status: createResp.status, 
        body: errorText.substring(0, 500) 
      });
      
      let errorReason = 'Failed to create IMEI check';
      try {
        const errorJson = JSON.parse(errorText);
        errorReason = errorJson.message || errorJson.error || errorReason;
      } catch (e) {}
      
      res.statusCode = createResp.status >= 500 ? 502 : createResp.status;
      return res.json({
        success: false,
        status: 'error',
        reason: `IMEICheck error: ${errorReason}`,
        rawStatus: createResp.status
      });
    }
    
    const createData = await createResp.json();
    const checkId = createData.id || createData.checkId;
    
    if (!checkId) {
      log('error', 'No checkId in response', { response: JSON.stringify(createData).substring(0, 500) });
      res.statusCode = 502;
      return res.json({
        success: false,
        status: 'error',
        reason: 'IMEICheck response missing check ID',
        rawStatus: 502
      });
    }
    
    log('info', 'Check created, polling for result', { checkId });
    
    // Poll for result
    let resultData = null;
    let status = 'pending';
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);
      
      let resultResp;
      try {
        resultResp = await fetch(`https://api.imeicheck.net/v1/checks/${checkId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });
      } catch (fetchError) {
        log('warn', 'Network error polling result', { attempt: i + 1, error: fetchError.message });
        continue;
      }
      
      if (!resultResp.ok) {
        const errorText = await resultResp.text();
        log('warn', 'Poll failed', { attempt: i + 1, status: resultResp.status });
        continue;
      }
      
      resultData = await resultResp.json();
      status = (resultData.status || resultData.state || '').toLowerCase();
      
      log('info', 'Poll result', { attempt: i + 1, status });
      
      if (['completed', 'done', 'success', 'successful'].includes(status)) {
        break;
      }
      
      if (['failed', 'error'].includes(status)) {
        log('error', 'Check failed on IMEICheck side', { status });
        res.statusCode = 200;
        return res.json({
          success: false,
          status: 'error',
          reason: 'IMEI check failed on provider side',
          checkId,
          raw: resultData
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Timeout
    if (!['completed', 'done', 'success', 'successful'].includes(status)) {
      log('warn', 'Check timed out', { checkId, lastStatus: status, duration });
      res.statusCode = 200;
      return res.json({
        success: false,
        status: 'timeout',
        checkId,
        message: 'IMEI check still pending. Try again in a few seconds.',
        raw: resultData
      });
    }
    
    // Success - normalize the result
    const summary = normalizeImeiResult(resultData);
    const analysis = calculateFraudScore(summary);
    
    log('info', 'Check completed successfully', { 
      checkId, 
      duration,
      model: summary.model,
      overallStatus: analysis.overallStatus
    });
    
    res.statusCode = 200;
    return res.json({
      success: true,
      status: 'completed',
      checkId,
      imei: cleanImei,
      checkedAt: new Date().toISOString(),
      summary,
      analysis,
      raw: resultData
    });
    
  } catch (err) {
    log('error', 'Unhandled error', { error: err.message, stack: err.stack });
    res.statusCode = 500;
    return res.json({
      success: false,
      status: 'error',
      reason: 'Server error while processing IMEI check',
      details: err.message
    });
  }
};

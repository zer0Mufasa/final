/**
 * Fixology IMEI Intelligence API
 * 
 * POST /api/imei-check
 * 
 * Modes:
 * - "basic" (default) - Free tier: Device model, IMEI validation, basic status (20% info)
 * - "deep" - PRO ONLY: Full device history, carrier, warranty, locks, blacklist (100% info)
 * - "blacklist" - Blacklist-only check
 */

const fs = require('fs').promises;
const path = require('path');

// Helper to append to log
async function logImeiCheck(entry) {
  try {
    const logPath = path.join(__dirname, '..', 'data', 'imei-log.json');
    let logs = [];
    try {
      const data = await fs.readFile(logPath, 'utf8');
      logs = JSON.parse(data);
    } catch (e) {}
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    if (logs.length > 10000) logs = logs.slice(-10000);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to log IMEI check:', e.message);
  }
}

// Helper to verify JWT token
function verifyAuthToken(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'fixology-super-secret-key-change-in-production';
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
}

// Helper to get user/shop subscription
async function getSubscription(decoded) {
  if (!decoded) return { plan: 'free', checksRemaining: 5 };
  
  try {
    const dataPath = path.join(__dirname, '..', 'data');
    
    if (decoded.type === 'shop') {
      const data = await fs.readFile(path.join(dataPath, 'shop-users.json'), 'utf8');
      const { shops } = JSON.parse(data);
      const shop = shops.find(s => s.id === decoded.id);
      if (shop) {
        const limit = shop.imeiChecksLimit || 10;
        const used = shop.imeiChecksUsed || 0;
        return { 
          plan: shop.subscriptionPlan, 
          checksRemaining: limit === -1 ? 999999 : Math.max(0, limit - used),
          shopId: shop.id
        };
      }
    } else {
      const data = await fs.readFile(path.join(dataPath, 'users.json'), 'utf8');
      const { users } = JSON.parse(data);
      const user = users.find(u => u.id === decoded.id);
      if (user) {
        return { 
          plan: user.plan || 'free', 
          checksRemaining: user.imeiCredits || 5,
          userId: user.id
        };
      }
    }
  } catch (e) {
    console.error('Error getting subscription:', e.message);
  }
  
  return { plan: 'free', checksRemaining: 0 };
}

// Helper to decrement check count
async function decrementCheckCount(decoded, checkType) {
  if (!decoded) return;
  
  try {
    const dataPath = path.join(__dirname, '..', 'data');
    
    if (decoded.type === 'shop') {
      const filePath = path.join(dataPath, 'shop-users.json');
      const data = await fs.readFile(filePath, 'utf8');
      const db = JSON.parse(data);
      const idx = db.shops.findIndex(s => s.id === decoded.id);
      if (idx !== -1) {
        db.shops[idx].imeiChecksUsed = (db.shops[idx].imeiChecksUsed || 0) + 1;
        await fs.writeFile(filePath, JSON.stringify(db, null, 2));
      }
    } else {
      const filePath = path.join(dataPath, 'users.json');
      const data = await fs.readFile(filePath, 'utf8');
      const db = JSON.parse(data);
      const idx = db.users.findIndex(u => u.id === decoded.id);
      if (idx !== -1 && checkType === 'deep') {
        db.users[idx].imeiCredits = Math.max(0, (db.users[idx].imeiCredits || 5) - 1);
        await fs.writeFile(filePath, JSON.stringify(db, null, 2));
      }
    }
  } catch (e) {
    console.error('Error decrementing check count:', e.message);
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Fixology IMEI Intelligence API',
      version: '3.0',
      modes: {
        basic: 'Free - Device model, IMEI validation, basic specs',
        deep: 'PRO ONLY - Full history, carrier, warranty, all locks, blacklist status',
        blacklist: 'Blacklist-only quick check'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    const imei = body.imei;
    let mode = body.mode || 'basic'; // 'basic', 'deep', or 'blacklist'

    if (!imei) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing IMEI number',
        hint: 'Dial *#06# on your device to find the IMEI'
      });
    }

    // Clean IMEI - remove all non-digits
    const cleanImei = imei.replace(/\D/g, '');

    // Validate IMEI format (should be 15 digits)
    if (cleanImei.length < 14 || cleanImei.length > 17) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IMEI format',
        hint: 'IMEI should be 15 digits. Dial *#06# to find it.'
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRO CHECK AUTHENTICATION
    // Deep checks require Pro/Enterprise subscription
    // ═══════════════════════════════════════════════════════════════════
    
    const decoded = verifyAuthToken(req);
    const subscription = await getSubscription(decoded);
    
    // Check if deep check is allowed
    if (mode === 'deep') {
      // Must be logged in
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for Deep Check',
          hint: 'Please log in to your Fixology account to access Pro features.',
          upgradeUrl: '/signup.html'
        });
      }
      
      // Must have Pro or Enterprise plan (for shops) or credits (for users)
      const isPro = ['pro', 'enterprise'].includes(subscription.plan);
      const hasCredits = subscription.checksRemaining > 0;
      
      if (!isPro && !hasCredits) {
        return res.status(403).json({
          success: false,
          error: 'Pro subscription required for Deep Check',
          hint: 'Upgrade to Pro to unlock full IMEI intelligence with blacklist, carrier, warranty, and security analysis.',
          currentPlan: subscription.plan,
          upgradeUrl: '/upgrade.html',
          availableInDeepCheck: [
            'Blacklist Status (Lost/Stolen)',
            'Find My iPhone Status',
            'iCloud Lock Status',
            'Carrier Lock Info',
            'Warranty Coverage',
            'Purchase Date',
            'MDM Lock Status',
            'Replacement History',
            'Full Security Analysis',
            'Trust Score'
          ]
        });
      }
      
      // Check remaining quota
      if (subscription.checksRemaining <= 0) {
        return res.status(403).json({
          success: false,
          error: 'IMEI check limit reached',
          hint: 'You have used all your IMEI checks for this billing period. Upgrade your plan for more checks.',
          currentPlan: subscription.plan,
          upgradeUrl: '/upgrade.html'
        });
      }
    }

    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'IMEI service not configured' 
      });
    }

    // Select service ID based on mode
    // Service IDs from imeicheck.net API
    // See: https://imeicheck.net/services for available services
    let serviceId;
    let serviceName;
    
    switch (mode) {
      case 'deep':
        serviceId = 3; // Apple Full Info (comprehensive check)
        serviceName = 'Deep Analysis';
        break;
      case 'blacklist':
        serviceId = 16; // USA Blacklist Check
        serviceName = 'Blacklist Check';
        break;
      case 'basic':
      default:
        serviceId = 1; // Apple Basic Info (limited)
        serviceName = 'Basic Check';
        break;
    }

    console.log(`IMEI Check: ${cleanImei} | Mode: ${mode} | Service: ${serviceId} | User: ${decoded?.email || 'anonymous'}`);

    // Initiate check with imeicheck.net API
    const checkResponse = await fetch('https://api.imeicheck.net/v1/checks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: cleanImei,
        serviceId: serviceId
      })
    });

    const checkData = await checkResponse.json();
    const checkId = checkData.id;

    if (!checkId) {
      console.error('IMEI Check failed:', checkData);
      return res.status(200).json({ 
        success: false, 
        error: 'Could not initiate IMEI check',
        details: checkData.message || 'Unknown error'
      });
    }

    // Poll for results (max 30 seconds)
    let result = null;
    let status = 'pending';

    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.imeicheck.net/v1/checks/${checkId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      result = await pollResponse.json();
      status = result.status || 'pending';
      
      if (status === 'successful' || status === 'completed' || status === 'done') {
        break;
      }
      if (status === 'unsuccessful' || status === 'failed') {
        break;
      }
    }

    const props = result.properties || {};
    
    // Log raw properties for debugging
    console.log('Raw API properties:', JSON.stringify(props, null, 2));

    // ═══════════════════════════════════════════════════════════════════
    // UNIVERSAL PROPERTY EXTRACTOR
    // Handles all known property name variations from imeicheck.net
    // ═══════════════════════════════════════════════════════════════════
    const extract = (...keys) => {
      for (const key of keys) {
        if (props[key] !== undefined && props[key] !== null && props[key] !== '') {
          return props[key];
        }
      }
      return null;
    };

    // Device Identification
    const deviceModel = extract(
      'deviceName', 'modelName', 'model', 'apple/modelName', 'apple/deviceName',
      'name', 'product', 'productName', 'device', 'marketingName'
    );
    
    const deviceImage = extract('image', 'imageUrl', 'imageURL', 'deviceImage', 'photo');
    
    const deviceSerial = extract(
      'serial', 'serialNumber', 'sn', 'apple/serial', 'apple/serialNumber'
    );
    
    const deviceImei2 = extract('imei2', 'IMEI2', 'secondImei');
    const deviceMeid = extract('meid', 'MEID');
    
    // Specifications
    const deviceColor = extract(
      'color', 'colour', 'deviceColor', 'apple/color', 'apple/colour',
      'colorName', 'colourName'
    );
    
    const deviceStorage = extract(
      'capacity', 'storage', 'storageCapacity', 'memorySize', 'size',
      'apple/capacity', 'apple/storage', 'internalMemory', 'rom'
    );
    
    const modelNumber = extract(
      'modelNumber', 'model_number', 'apple/modelNumber', 'modelNum', 'partNumber'
    );
    
    // Network & Carrier
    const carrierName = extract(
      'network', 'carrier', 'simLockCarrier', 'carrierName', 'operator',
      'lockCarrier', 'lockedCarrier', 'apple/carrier', 'mobileNetwork'
    );
    
    const simLockStatus = extract(
      'simLock', 'simLocked', 'carrierLock', 'networkLock', 'simLockStatus',
      'locked', 'unlocked', 'apple/simLock'
    );
    
    const countryInfo = extract(
      'purchaseCountry', 'saleCountry', 'country', 'region', 'soldIn',
      'initialCarrierCountry', 'apple/country'
    );
    
    // Security Status
    const fmiStatus = extract(
      'fmiOn', 'findMyiPhone', 'findMyIphone', 'findMy', 'fmi',
      'apple/fmi', 'apple/findMyIphone', 'findMyiPhoneOn'
    );
    
    const icloudStatus = extract(
      'icloudLock', 'iCloudLock', 'icloud', 'activationLock',
      'apple/icloud', 'apple/activationLock', 'iCloudStatus'
    );
    
    const lostModeStatus = extract(
      'lostMode', 'lostModeEnabled', 'lost', 'apple/lostMode', 'lostModeStatus'
    );
    
    const mdmStatus = extract(
      'mdmLocked', 'mdm', 'mdmLock', 'mdmStatus', 'remoteLock',
      'apple/mdm', 'deviceManagement'
    );
    
    // Blacklist
    const blacklistInfo = extract(
      'usaBlockStatus', 'blacklistStatus', 'blacklisted', 'blocked',
      'gsmaBlacklist', 'blockStatus', 'blacklist', 'stolen', 'lost'
    );
    
    const blacklistCountryInfo = extract('blacklistCountry', 'blockedCountry');
    const blacklistReasonInfo = extract('blacklistReason', 'blockReason', 'reason');
    
    // Warranty
    const warrantyInfo = extract(
      'warrantyStatus', 'coverageStatus', 'warranty', 'warrantyCoverage',
      'apple/warranty', 'warrantyType', 'coverage'
    );
    
    const warrantyExpiry = extract(
      'warrantyExpiry', 'coverageExpiry', 'warrantyEndDate', 'warrantyEnd',
      'coverageEndDate', 'apple/warrantyExpiry', 'expirationDate'
    );
    
    const appleCareInfo = extract(
      'appleCare', 'appleCarePlus', 'appleCareStatus', 'apple/appleCare',
      'acPlusStatus'
    );
    
    // Purchase Info
    const purchaseDateRaw = extract(
      'estPurchaseDate', 'purchaseDate', 'activationDate', 'soldDate',
      'initialActivation', 'firstActivation', 'apple/purchaseDate'
    );
    
    const purchaseDate = purchaseDateRaw 
      ? (typeof purchaseDateRaw === 'number' 
          ? new Date(purchaseDateRaw * 1000).toLocaleDateString()
          : purchaseDateRaw)
      : null;
    
    // Device History
    const replacedStatus = extract('replaced', 'replacement', 'isReplacement');
    const refurbishedStatus = extract('refurbished', 'isRefurbished', 'refurb');
    const demoStatus = extract('demoUnit', 'isDemo', 'demo', 'displayUnit');
    
    // ═══════════════════════════════════════════════════════════════════
    // BASIC CHECK RESPONSE (Free Tier - ~20% of info)
    // ═══════════════════════════════════════════════════════════════════
    if (mode === 'basic') {
      const hasIssues = blacklistInfo === 'Blacklisted' || 
                        lostModeStatus === true || 
                        fmiStatus === true;

      return res.status(200).json({
        success: true,
        mode: 'basic',
        serviceName: serviceName,
        checkId: checkId,
        imei: cleanImei,
        
        // Basic info only
        device: {
          model: deviceModel || 'Unknown Device',
          brand: detectBrand(deviceModel || ''),
          image: deviceImage,
          imeiValid: cleanImei.length === 15
        },
        
        // Simplified status
        quickStatus: getQuickStatus(props),
        
        // Upgrade prompt
        limitedInfo: true,
        upgradeMessage: hasIssues 
          ? '⚠️ Potential issues detected. Run a DEEP CHECK to see full details including blacklist status, carrier lock, Find My status, and warranty info.'
          : '✓ No obvious issues. Run a DEEP CHECK for complete device history, carrier info, warranty status, and detailed security analysis.',
        
        // What they're missing
        availableInDeepCheck: [
          'Blacklist Status (Lost/Stolen)',
          'Find My iPhone Status',
          'iCloud Lock Status', 
          'Carrier Lock Info',
          'Warranty Coverage',
          'Purchase Date',
          'MDM Lock Status',
          'Replacement History',
          'Full Security Analysis',
          'Trust Score'
        ],
        
        // Include raw for debugging
        _debug: { propsReceived: Object.keys(props).length }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // DEEP CHECK RESPONSE (Premium Tier - 100% of info)
    // ═══════════════════════════════════════════════════════════════════
    
    // Format boolean/status values for display
    const formatBool = (val, onTrue, onFalse, unknown = 'Unknown') => {
      if (val === true || val === 'true' || val === 1 || val === '1' || val === 'ON' || val === 'Yes') return onTrue;
      if (val === false || val === 'false' || val === 0 || val === '0' || val === 'OFF' || val === 'No') return onFalse;
      if (typeof val === 'string' && val.length > 0) return val;
      return unknown;
    };
    
    const fullSummary = {
      // Device Identification
      model: deviceModel || 'Unknown Device',
      brand: detectBrand(deviceModel || ''),
      image: deviceImage,
      imei: cleanImei,
      imei2: deviceImei2,
      serial: deviceSerial,
      meid: deviceMeid,
      
      // Specifications
      color: deviceColor,
      storage: deviceStorage,
      model_number: modelNumber,
      
      // Security Status
      simLock: formatBool(simLockStatus, 'Locked', 'Unlocked'),
      carrier: carrierName || 'Unknown',
      findMy: formatBool(fmiStatus, 'ON', 'OFF'),
      iCloudLock: formatBool(icloudStatus, 'Locked', 'Unlocked'),
      lostMode: formatBool(lostModeStatus, 'ENABLED', 'OFF'),
      mdmLock: formatBool(mdmStatus, 'ENROLLED', 'Not Enrolled'),
      
      // Blacklist Status
      blacklistStatus: blacklistInfo || 'Clean',
      blacklistCountry: blacklistCountryInfo,
      blacklistReason: blacklistReasonInfo,
      
      // Warranty & Purchase
      warrantyStatus: warrantyInfo || 'Unknown',
      warrantyExpiry: warrantyExpiry,
      purchaseDate: purchaseDate,
      purchaseCountry: countryInfo,
      appleCarePlus: formatBool(appleCareInfo, 'Active', 'Not Active'),
      
      // Device History
      replaced: formatBool(replacedStatus, 'Yes (Replacement)', 'No (Original)'),
      refurbished: formatBool(refurbishedStatus, 'Yes', 'No'),
      demoUnit: formatBool(demoStatus, 'Yes (Demo)', 'No')
    };

    // ═══════════════════════════════════════════════════════════════════
    // COMPREHENSIVE FRAUD/RISK ANALYSIS
    // ═══════════════════════════════════════════════════════════════════
    let riskScore = 0;
    const riskFlags = [];
    const securityIssues = [];
    const warnings = [];
    const positives = [];

    // CRITICAL ISSUES (High Risk)
    if (fullSummary.blacklistStatus === 'Blacklisted' || 
        fullSummary.blacklistStatus === 'Lost' || 
        fullSummary.blacklistStatus === 'Stolen') {
      riskScore += 50;
      riskFlags.push({
        severity: 'critical',
        issue: 'BLACKLISTED',
        description: `Device is reported as ${fullSummary.blacklistStatus}`,
        recommendation: 'DO NOT PURCHASE - This device cannot be activated on most carriers'
      });
      securityIssues.push('🚫 Device is BLACKLISTED');
    }

    if (fullSummary.lostMode === 'ENABLED') {
      riskScore += 40;
      riskFlags.push({
        severity: 'critical',
        issue: 'LOST MODE ACTIVE',
        description: 'Device has Lost Mode enabled by owner',
        recommendation: 'DO NOT PURCHASE - Device is likely lost or stolen'
      });
      securityIssues.push('🚨 Lost Mode is ENABLED');
    }

    if (fullSummary.iCloudLock === 'Locked') {
      riskScore += 45;
      riskFlags.push({
        severity: 'critical',
        issue: 'iCLOUD LOCKED',
        description: 'Device is locked to previous owner\'s iCloud account',
        recommendation: 'Request seller remove iCloud lock before purchase'
      });
      securityIssues.push('🔒 iCloud Activation Lock is ON');
    }

    // HIGH RISK ISSUES
    if (fullSummary.findMy === 'ON') {
      riskScore += 20;
      riskFlags.push({
        severity: 'high',
        issue: 'FIND MY iPHONE ON',
        description: 'Find My iPhone is still enabled',
        recommendation: 'Ask seller to sign out of iCloud and disable Find My before purchase'
      });
      warnings.push('⚠️ Find My iPhone is ON - Request seller disable it');
    }

    if (fullSummary.mdmLock === 'ENROLLED') {
      riskScore += 30;
      riskFlags.push({
        severity: 'high',
        issue: 'MDM ENROLLED',
        description: 'Device is enrolled in Mobile Device Management (corporate/school)',
        recommendation: 'Device may be remotely wiped or restricted. Verify it\'s been properly released.'
      });
      warnings.push('⚠️ MDM Lock detected - May be corporate/school device');
    }

    // MODERATE ISSUES
    if (fullSummary.simLock === 'Locked') {
      riskScore += 10;
      riskFlags.push({
        severity: 'medium',
        issue: 'CARRIER LOCKED',
        description: `Device is locked to ${fullSummary.carrier || 'a carrier'}`,
        recommendation: 'Device will only work with specific carrier unless unlocked'
      });
      warnings.push(`📱 Carrier Locked to ${fullSummary.carrier || 'unknown carrier'}`);
    }

    if (fullSummary.replaced === 'Yes (Replacement Device)') {
      riskScore += 5;
      warnings.push('🔄 This is a replacement device (not original)');
    }

    if (fullSummary.refurbished === 'Yes') {
      riskScore += 5;
      warnings.push('♻️ Device is refurbished');
    }

    if (fullSummary.demoUnit === 'Yes (Demo Device)') {
      riskScore += 10;
      warnings.push('🏪 This is a demo/display unit');
    }

    // POSITIVE INDICATORS
    if (fullSummary.blacklistStatus === 'Clean' || fullSummary.blacklistStatus === 'Not Blacklisted') {
      positives.push('✅ Not blacklisted - Clean status');
    }

    if (fullSummary.findMy === 'OFF') {
      positives.push('✅ Find My iPhone is OFF');
    }

    if (fullSummary.simLock === 'Unlocked') {
      positives.push('✅ Factory Unlocked - Works with any carrier');
    }

    if (fullSummary.iCloudLock === 'Unlocked') {
      positives.push('✅ No iCloud Activation Lock');
    }

    if (fullSummary.warrantyStatus === 'Active' || fullSummary.warrantyStatus === 'AppleCare+') {
      positives.push(`✅ Warranty: ${fullSummary.warrantyStatus}`);
    }

    if (fullSummary.mdmLock === 'Not Enrolled') {
      positives.push('✅ No MDM restrictions');
    }

    // Calculate Trust Score
    const trustScore = Math.max(0, 100 - riskScore);

    // Determine overall status
    let overallStatus, statusMessage, statusEmoji;
    
    if (riskScore >= 40) {
      overallStatus = 'high_risk';
      statusEmoji = '🚫';
      statusMessage = 'HIGH RISK - Do not purchase without resolving issues';
    } else if (riskScore >= 20) {
      overallStatus = 'caution';
      statusEmoji = '⚠️';
      statusMessage = 'CAUTION - Review warnings before purchasing';
    } else if (riskScore >= 10) {
      overallStatus = 'minor_issues';
      statusEmoji = '📋';
      statusMessage = 'MINOR ISSUES - Generally safe with noted concerns';
    } else {
      overallStatus = 'clean';
      statusEmoji = '✅';
      statusMessage = 'CLEAN - Safe to purchase';
    }

    // Build recommendation
    let recommendation;
    if (overallStatus === 'high_risk') {
      recommendation = 'We strongly recommend NOT purchasing this device until all critical issues are resolved. If buying used, request proof of ownership and original purchase receipt.';
    } else if (overallStatus === 'caution') {
      recommendation = 'Proceed with caution. Ask the seller to address the warnings listed above before completing the purchase.';
    } else if (overallStatus === 'minor_issues') {
      recommendation = 'Device is generally safe to purchase. Be aware of the minor issues noted above.';
    } else {
      recommendation = 'This device appears safe to purchase. All security checks passed.';
    }

    // Log the check and decrement count
    await logImeiCheck({
      imei: cleanImei,
      mode: mode,
      device: fullSummary.model,
      status: overallStatus,
      userId: subscription.userId || null,
      shopId: subscription.shopId || null
    });
    
    // Decrement check count for authenticated users
    if (decoded) {
      await decrementCheckCount(decoded, mode);
    }

    return res.status(200).json({
      success: true,
      mode: mode === 'blacklist' ? 'blacklist' : 'deep',
      serviceName: serviceName,
      checkId: checkId,
      status: status,
      
      // Full Device Information
      device: {
        model: fullSummary.model,
        brand: fullSummary.brand,
        color: fullSummary.color,
        storage: fullSummary.storage,
        modelNumber: fullSummary.model_number,
        image: fullSummary.image
      },
      
      // Identifiers
      identifiers: {
        imei: fullSummary.imei,
        imei2: fullSummary.imei2,
        serial: fullSummary.serial,
        meid: fullSummary.meid
      },
      
      // Security Status
      security: {
        blacklistStatus: fullSummary.blacklistStatus,
        blacklistDetails: fullSummary.blacklistReason ? {
          reason: fullSummary.blacklistReason,
          country: fullSummary.blacklistCountry
        } : null,
        findMyiPhone: fullSummary.findMy,
        iCloudLock: fullSummary.iCloudLock,
        lostMode: fullSummary.lostMode,
        mdmLock: fullSummary.mdmLock,
        carrierLock: fullSummary.simLock,
        carrier: fullSummary.carrier
      },
      
      // Warranty & Purchase
      warranty: {
        status: fullSummary.warrantyStatus,
        expiry: fullSummary.warrantyExpiry,
        appleCare: fullSummary.appleCarePlus
      },
      
      purchase: {
        date: fullSummary.purchaseDate,
        country: fullSummary.purchaseCountry
      },
      
      // Device History
      history: {
        replaced: fullSummary.replaced,
        refurbished: fullSummary.refurbished,
        demoUnit: fullSummary.demoUnit
      },
      
      // Risk Analysis
      analysis: {
        trustScore: trustScore,
        riskScore: riskScore,
        overallStatus: overallStatus,
        statusEmoji: statusEmoji,
        statusMessage: statusMessage,
        recommendation: recommendation,
        
        // Detailed flags
        criticalIssues: securityIssues,
        warnings: warnings,
        positives: positives,
        
        // All flags with details
        allFlags: riskFlags
      },
      
      // Raw data for debugging (optional)
      _raw: process.env.NODE_ENV === 'development' ? result : undefined
    });

  } catch (err) {
    console.error('IMEI Check Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'IMEI check failed',
      message: err.message 
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function detectBrand(modelName) {
  const name = (modelName || '').toLowerCase();
  if (name.includes('iphone') || name.includes('ipad') || name.includes('apple') || name.includes('mac')) {
    return 'Apple';
  }
  if (name.includes('samsung') || name.includes('galaxy')) {
    return 'Samsung';
  }
  if (name.includes('pixel') || name.includes('google')) {
    return 'Google';
  }
  if (name.includes('oneplus')) {
    return 'OnePlus';
  }
  if (name.includes('xiaomi') || name.includes('redmi') || name.includes('poco')) {
    return 'Xiaomi';
  }
  if (name.includes('huawei') || name.includes('honor')) {
    return 'Huawei';
  }
  if (name.includes('oppo')) {
    return 'OPPO';
  }
  if (name.includes('vivo')) {
    return 'Vivo';
  }
  if (name.includes('motorola') || name.includes('moto')) {
    return 'Motorola';
  }
  if (name.includes('lg')) {
    return 'LG';
  }
  if (name.includes('sony') || name.includes('xperia')) {
    return 'Sony';
  }
  return 'Unknown';
}

function getQuickStatus(props) {
  // Quick status for basic check - just a hint
  const issues = [];
  
  if (props.usaBlockStatus === 'Blacklisted' || props.lostMode === true) {
    return {
      status: 'issues_detected',
      message: '⚠️ Potential issues detected - Run deep check for details',
      color: 'red'
    };
  }
  
  if (props.fmiOn === true || props.simLock === true) {
    return {
      status: 'review_needed', 
      message: '📋 Some items need review - Run deep check for details',
      color: 'yellow'
    };
  }
  
  return {
    status: 'looks_ok',
    message: '✓ No obvious issues - Run deep check for full verification',
    color: 'green'
  };
}

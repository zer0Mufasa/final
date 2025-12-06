/**
 * Fixology IMEI Intelligence API
 * 
 * POST /api/imei-check
 * 
 * Modes:
 * - "basic" (default) - Free tier: Device model, IMEI validation, basic status (20% info)
 * - "deep" - Premium tier: Full device history, carrier, warranty, locks, blacklist (100% info)
 * - "blacklist" - Blacklist-only check
 */

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Fixology IMEI Intelligence API',
      version: '2.0',
      modes: {
        basic: 'Free - Device model, IMEI validation, basic specs',
        deep: 'Premium - Full history, carrier, warranty, all locks, blacklist status',
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
    const mode = body.mode || 'basic'; // 'basic', 'deep', or 'blacklist'

    if (!imei) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing IMEI number',
        hint: 'Dial *#06# on your device to find the IMEI'
      });
    }

    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'IMEI service not configured' 
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

    console.log(`IMEI Check: ${cleanImei} | Mode: ${mode} | Service: ${serviceId}`);

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

    // ═══════════════════════════════════════════════════════════════════
    // BASIC CHECK RESPONSE (Free Tier - ~20% of info)
    // ═══════════════════════════════════════════════════════════════════
    if (mode === 'basic') {
      const basicSummary = {
        // Device Identification (always shown)
        imei: cleanImei,
        imeiValid: cleanImei.length === 15,
        model: props.deviceName || props['apple/modelName'] || props.modelName || 'Unknown Device',
        brand: detectBrand(props.deviceName || props['apple/modelName'] || ''),
        image: props.image || null,
        
        // Basic Status (limited)
        status: 'Basic check complete',
        
        // Teaser info (to encourage upgrade)
        quickStatus: getQuickStatus(props),
      };

      // Basic risk assessment (simplified)
      const hasIssues = props.usaBlockStatus === 'Blacklisted' || 
                        props.lostMode === true || 
                        props.fmiOn === true;

      return res.status(200).json({
        success: true,
        mode: 'basic',
        serviceName: serviceName,
        checkId: checkId,
        imei: cleanImei,
        
        // Basic info only
        device: {
          model: basicSummary.model,
          brand: basicSummary.brand,
          image: basicSummary.image,
          imeiValid: basicSummary.imeiValid
        },
        
        // Simplified status
        quickStatus: basicSummary.quickStatus,
        
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
        ]
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // DEEP CHECK RESPONSE (Premium Tier - 100% of info)
    // ═══════════════════════════════════════════════════════════════════
    const fullSummary = {
      // Device Identification
      model: props.deviceName || props['apple/modelName'] || props.modelName || 'Unknown',
      brand: detectBrand(props.deviceName || props['apple/modelName'] || ''),
      image: props.image || null,
      imei: props.imei || cleanImei,
      imei2: props.imei2 || null,
      serial: props.serial || props.serialNumber || null,
      meid: props.meid || null,
      
      // Specifications
      color: props.color || props.deviceColor || null,
      storage: props.capacity || props.storage || null,
      model_number: props.modelNumber || props['apple/modelNumber'] || null,
      
      // Security Status
      simLock: props.simLock === true ? 'Locked' : props.simLock === false ? 'Unlocked' : (props.carrierLock || 'Unknown'),
      carrier: props.network || props.carrier || props.simLockCarrier || 'Unknown',
      findMy: props.fmiOn === true ? 'ON' : props.fmiOn === false ? 'OFF' : 'Unknown',
      iCloudLock: props.icloudLock === true ? 'Locked' : props.icloudLock === false ? 'Unlocked' : 'Unknown',
      lostMode: props.lostMode === true ? 'ENABLED' : props.lostMode === false ? 'OFF' : 'Unknown',
      mdmLock: props.mdmLocked === true ? 'ENROLLED' : props.mdmLocked === false ? 'Not Enrolled' : 'Unknown',
      
      // Blacklist Status
      blacklistStatus: props.usaBlockStatus || props.blacklistStatus || 'Unknown',
      blacklistCountry: props.blacklistCountry || null,
      blacklistReason: props.blacklistReason || null,
      gsmaBlacklist: props.gsmaBlacklist || null,
      
      // Warranty & Purchase
      warrantyStatus: props.warrantyStatus || props.coverageStatus || 'Unknown',
      warrantyExpiry: props.warrantyExpiry || props.coverageExpiry || null,
      purchaseDate: props.estPurchaseDate ? new Date(props.estPurchaseDate * 1000).toLocaleDateString() : (props.purchaseDate || null),
      purchaseCountry: props.purchaseCountry || props.saleCountry || null,
      appleCarePlus: props.appleCare === true ? 'Active' : props.appleCare === false ? 'Not Active' : 'Unknown',
      
      // Device History
      replaced: props.replaced === true ? 'Yes (Replacement Device)' : props.replaced === false ? 'No (Original)' : 'Unknown',
      refurbished: props.refurbished === true ? 'Yes' : props.refurbished === false ? 'No' : 'Unknown',
      demoUnit: props.demoUnit === true ? 'Yes (Demo Device)' : props.demoUnit === false ? 'No' : 'Unknown',
      
      // Technical
      activationStatus: props.activationStatus || null,
      nextTetheredActivation: props.nextTetheredActivation || null
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

export default async function handler(req, res) {
  // CORS headers (backup - Vercel should handle this)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Get API key
    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'IMEICHECK_API_KEY is not configured on the server'
      });
    }

    // Parse body
    const body = req.body || {};
    const imei = body.imei;

    // Validate IMEI
    if (!imei || typeof imei !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing "imei" in request body'
      });
    }

    const cleanImei = imei.replace(/\D/g, '');
    if (cleanImei.length < 14 || cleanImei.length > 17) {
      return res.status(400).json({
        success: false,
        error: 'IMEI must be 14-17 digits'
      });
    }

    console.log('Starting IMEI check for:', cleanImei.substring(0, 8) + '...');

    // Create check with IMEICheck.net
    const createResponse = await fetch('https://api.imeicheck.net/v1/checks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        deviceId: cleanImei,
        serviceId: 12
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('IMEICheck create error:', createResponse.status, errorText);
      return res.status(502).json({
        success: false,
        error: 'Failed to create IMEI check',
        details: errorText
      });
    }

    const createData = await createResponse.json();
    const checkId = createData.id || createData.checkId;

    if (!checkId) {
      return res.status(502).json({
        success: false,
        error: 'No check ID returned from IMEICheck'
      });
    }

    console.log('Check created with ID:', checkId);

    // Poll for result (max 10 attempts, 2 seconds apart)
    let result = null;
    let status = 'pending';

    for (let attempt = 1; attempt <= 10; attempt++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollResponse = await fetch(
        `https://api.imeicheck.net/v1/checks/${checkId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!pollResponse.ok) {
        console.error('Poll error:', pollResponse.status);
        continue;
      }

      result = await pollResponse.json();
      status = (result.status || result.state || '').toLowerCase();

      console.log(`Poll attempt ${attempt}: status = ${status}`);

      if (['completed', 'done', 'success', 'successful'].includes(status)) {
        break;
      }

      if (['failed', 'error'].includes(status)) {
        return res.status(200).json({
          success: false,
          status: 'error',
          error: 'IMEI check failed on provider side',
          checkId,
          raw: result
        });
      }
    }

    // Check if we got a result
    const isComplete = ['completed', 'done', 'success', 'successful'].includes(status);

    if (!isComplete) {
      return res.status(200).json({
        success: false,
        status: 'timeout',
        message: 'Check still pending. Try again in a few seconds.',
        checkId
      });
    }

    // Normalize the result
    const props = result.properties || result.result || result.data || result;
    
    const summary = {
      model: props.deviceName || props.modelName || props.model || 'Unknown',
      brand: detectBrand(props.deviceName || props.modelName || ''),
      storage: props.capacity || props.storage || null,
      color: props.color || null,
      serial: props.serialNumber || props.serial || null,
      carrier: props.carrier || props.network || 'Unknown',
      country: props.country || null,
      simLock: parseStatus(props.simLock || props.carrierLock, 'Locked', 'Unlocked'),
      blacklist: parseStatus(props.blacklistStatus || props.blacklisted, 'Blacklisted', 'Clean'),
      findMy: parseStatus(props.fmi || props.findMyiPhone, 'ON', 'OFF'),
      activationLock: parseStatus(props.activationLock || props.icloudLock, 'ON', 'OFF'),
      mdm: parseStatus(props.mdmLock || props.mdm, 'ON', 'OFF'),
      warranty: props.warrantyStatus || 'Unknown'
    };

    // Calculate fraud score
    const analysis = calculateAnalysis(summary);

    return res.status(200).json({
      success: true,
      status: 'completed',
      checkId,
      imei: cleanImei,
      summary,
      analysis,
      raw: result
    });

  } catch (error) {
    console.error('IMEI check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
}

function detectBrand(model) {
  const m = model.toLowerCase();
  if (m.includes('iphone') || m.includes('ipad')) return 'Apple';
  if (m.includes('samsung') || m.includes('galaxy')) return 'Samsung';
  if (m.includes('pixel')) return 'Google';
  return 'Unknown';
}

function parseStatus(value, trueVal, falseVal) {
  if (!value) return 'Unknown';
  const v = String(value).toLowerCase();
  if (['true', 'yes', 'on', '1', 'locked', 'blacklisted', 'active'].includes(v)) return trueVal;
  if (['false', 'no', 'off', '0', 'unlocked', 'clean', 'inactive'].includes(v)) return falseVal;
  return String(value);
}

function calculateAnalysis(summary) {
  let score = 0;
  const flags = [];

  if (summary.blacklist === 'Blacklisted') {
    score += 50;
    flags.push('Device is BLACKLISTED');
  }
  if (summary.activationLock === 'ON') {
    score += 35;
    flags.push('Activation Lock is ON');
  }
  if (summary.findMy === 'ON') {
    score += 10;
    flags.push('Find My is enabled');
  }
  if (summary.mdm === 'ON') {
    score += 25;
    flags.push('MDM lock detected');
  }
  if (summary.simLock === 'Locked') {
    score += 5;
    flags.push('Carrier locked');
  }

  const trustScore = Math.max(0, 100 - score);
  
  let overallStatus = 'clean';
  let statusMessage = 'Device is CLEAN — Safe to purchase';
  
  if (score >= 40) {
    overallStatus = 'flagged';
    statusMessage = 'HIGH RISK — Not recommended';
  } else if (score >= 15) {
    overallStatus = 'warning';
    statusMessage = 'CAUTION — Review issues before purchasing';
  }

  return {
    fraudScore: score,
    trustScore,
    overallStatus,
    statusMessage,
    flags: flags.length > 0 ? flags : ['No issues detected']
  };
}
```

**Key changes:**
- Using `export default` instead of `module.exports` (modern Vercel preference)
- Simplified the code structure
- Better error handling

---

### Step 3: Confirm Environment Variable

Go to Vercel → Settings → Environment Variables

Make sure you have:
- **Key:** `IMEICHECK_API_KEY`
- **Value:** `kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### Step 4: Redeploy

After updating both files:
1. Commit changes in GitHub
2. Go to Vercel → Deployments
3. Wait for the new deployment to show **Ready**

---

### Step 5: Test

**Test 1:** Visit this URL directly in your browser:
```
https://final-oc9r.vercel.app/api/imei-check

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET (for browser testing)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'IMEI API is running. Use POST with {"imei": "your-imei"}'
    });
  }

  // Only allow POST for actual checks
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'IMEICHECK_API_KEY not configured'
      });
    }

    const body = req.body || {};
    const imei = body.imei;

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

    // Create check with IMEICheck.net
    const createResponse = await fetch('https://api.imeicheck.net/v1/checks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: cleanImei,
        serviceId: 12
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return res.status(502).json({
        success: false,
        error: 'IMEICheck API error',
        details: errorText
      });
    }

    const createData = await createResponse.json();
    const checkId = createData.id || createData.checkId;

    if (!checkId) {
      return res.status(502).json({
        success: false,
        error: 'No check ID returned'
      });
    }

    // Poll for result
    let result = null;
    let status = 'pending';

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));

      const pollResponse = await fetch(
        `https://api.imeicheck.net/v1/checks/${checkId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        }
      );

      if (pollResponse.ok) {
        result = await pollResponse.json();
        status = (result.status || '').toLowerCase();
        if (['completed', 'done', 'success'].includes(status)) break;
      }
    }

    const isComplete = ['completed', 'done', 'success'].includes(status);
    
    if (!isComplete) {
      return res.status(200).json({
        success: false,
        status: 'timeout',
        message: 'Check still pending',
        checkId
      });
    }

    // Build response
    const props = result.properties || result.result || result;
    
    return res.status(200).json({
      success: true,
      status: 'completed',
      checkId,
      imei: cleanImei,
      summary: {
        model: props.deviceName || props.modelName || 'Unknown',
        carrier: props.carrier || props.network || 'Unknown',
        simLock: props.simLock || 'Unknown',
        blacklist: props.blacklistStatus || props.blacklisted || 'Unknown',
        findMy: props.fmi || props.findMyiPhone || 'Unknown',
        warranty: props.warrantyStatus || 'Unknown'
      },
      raw: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
};
```

---

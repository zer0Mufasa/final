module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'IMEI API is running',
      hasApiKey: !!process.env.IMEICHECK_API_KEY
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const body = req.body || {};
    const imei = body.imei;

    if (!imei) {
      return res.status(400).json({ error: 'Missing imei' });
    }

    const apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'No API key configured' });
    }

    // Test the IMEICheck API
    const response = await fetch('https://api.imeicheck.net/v1/checks', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: imei.replace(/\D/g, ''),
        serviceId: 12
      })
    });

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      apiResponse: data
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Caught error', 
      message: error.message 
    });
  }
};
```

Commit this, wait for deployment, then test:
```
https://final-bice-phi.vercel.app/api/imei-check

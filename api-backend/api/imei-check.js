module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'IMEI API is running'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    var body = req.body || {};
    var imei = body.imei;

    if (!imei) {
      return res.status(400).json({ error: 'Missing imei' });
    }

    var apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'No API key' });
    }

    var response = await fetch('https://api.imeicheck.net/v1/checks', {
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

    var data = await response.json();
    var checkId = data.id;

    if (!checkId) {
      return res.status(200).json({ success: false, error: 'No check ID', raw: data });
    }

    var result = null;
    for (var i = 0; i < 10; i++) {
      await new Promise(function(r) { setTimeout(r, 2000); });
      var poll = await fetch('https://api.imeicheck.net/v1/checks/' + checkId, {
        headers: { 'Authorization': 'Bearer ' + apiKey }
      });
      result = await poll.json();
      if (result.status === 'completed' || result.status === 'done') {
        break;
      }
    }

    return res.status(200).json({ success: true, data: result });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

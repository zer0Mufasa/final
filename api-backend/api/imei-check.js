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
      message: 'IMEI API is running',
      version: '1.0'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    var body = req.body || {};
    var imei = body.imei;
    var mode = body.mode || 'basic';

    if (!imei) {
      return res.status(400).json({ error: 'Missing imei' });
    }

    var apiKey = process.env.IMEICHECK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'No API key' });
    }

    var cleanImei = imei.replace(/\D/g, '');

    var serviceId = 1;
    if (mode === 'full') {
      serviceId = 3;
    } else if (mode === 'blacklist') {
      serviceId = 16;
    }

    var response = await fetch('https://api.imeicheck.net/v1/checks', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: cleanImei,
        serviceId: serviceId
      })
    });

    var data = await response.json();
    var checkId = data.id;

    if (!checkId) {
      return res.status(200).json({ success: false, error: 'No check ID', raw: data });
    }

    var result = null;
    var status = 'pending';

    for (var i = 0; i < 15; i++) {
      await new Promise(function(r) { setTimeout(r, 2000); });
      
      var poll = await fetch('https://api.imeicheck.net/v1/checks/' + checkId, {
        headers: { 'Authorization': 'Bearer ' + apiKey }
      });
      
      result = await poll.json();
      status = result.status || 'pending';
      
      if (status === 'successful' || status === 'completed' || status === 'done') {
        break;
      }
      if (status === 'unsuccessful' || status === 'failed') {
        break;
      }
    }

    var props = result.properties || {};

    var summary = {
      model: props.deviceName || props['apple/modelName'] || 'Unknown',
      image: props.image || null,
      imei: props.imei || cleanImei,
      serial: props.serial || null,
      simLock: props.simLock === true ? 'Locked' : props.simLock === false ? 'Unlocked' : 'Unknown',
      findMy: props.fmiOn === true ? 'ON' : props.fmiOn === false ? 'OFF' : 'Unknown',
      lostMode: props.lostMode === true ? 'ON' : props.lostMode === false ? 'OFF' : 'Unknown',
      blacklist: props.usaBlockStatus || 'Unknown',
      warranty: props.warrantyStatus || 'Unknown',
      replaced: props.replaced === true ? 'Yes' : props.replaced === false ? 'No' : 'Unknown',
      carrier: props.network || 'Unknown',
      mdm: props.mdmLocked === true ? 'ON' : props.mdmLocked === false ? 'OFF' : 'Unknown',
      purchaseDate: props.estPurchaseDate ? new Date(props.estPurchaseDate * 1000).toLocaleDateString() : null
    };

    var fraudScore = 0;
    var flags = [];

    if (summary.blacklist === 'Blacklisted' || summary.blacklist === 'Lost' || summary.blacklist === 'Stolen') {
      fraudScore += 50;
      flags.push('Device is BLACKLISTED');
    }
    if (summary.findMy === 'ON') {
      fraudScore += 15;
      flags.push('Find My iPhone is ON');
    }
    if (summary.lostMode === 'ON') {
      fraudScore += 40;
      flags.push('Lost Mode is ENABLED');
    }
    if (summary.mdm === 'ON') {
      fraudScore += 25;
      flags.push('MDM Lock detected');
    }
    if (summary.simLock === 'Locked') {
      fraudScore += 5;
      flags.push('Carrier locked');
    }
    if (summary.replaced === 'Yes') {
      fraudScore += 5;
      flags.push('Device was replaced');
    }

    var trustScore = Math.max(0, 100 - fraudScore);
    var overallStatus = 'clean';
    var statusMessage = 'Device is CLEAN - Safe to purchase';

    if (fraudScore >= 40) {
      overallStatus = 'flagged';
      statusMessage = 'HIGH RISK - Not recommended';
    } else if (fraudScore >= 15) {
      overallStatus = 'warning';
      statusMessage = 'CAUTION - Review issues';
    }

    if (flags.length === 0) {
      flags.push('No issues detected');
    }

    return res.status(200).json({
      success: true,
      status: status,
      checkId: checkId,
      imei: cleanImei,
      summary: summary,
      analysis: {
        fraudScore: fraudScore,
        trustScore: trustScore,
        overallStatus: overallStatus,
        statusMessage: statusMessage,
        flags: flags
      },
      raw: result
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

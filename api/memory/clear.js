/**
 * POST /api/memory/clear
 * Clear conversation memory for a user
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../../lib/utils');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const auth = await requireAuth(req, res);
    
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    const userId = auth.user?.id || auth.shop?.id;
    const body = req.body || {};
    const clearType = body.type || 'all'; // 'all', 'messages', 'imei', 'diagnostics', 'search'

    // Load memory database
    const memoryDb = await readDatabase('memory.json');
    const conversations = memoryDb.conversations || {};

    if (!conversations[userId]) {
      return sendSuccess(res, { message: 'No memory to clear' });
    }

    switch (clearType) {
      case 'messages':
        conversations[userId].messages = [];
        break;
      case 'imei':
        conversations[userId].imeiHistory = [];
        break;
      case 'diagnostics':
        conversations[userId].diagnosticsHistory = [];
        break;
      case 'search':
        conversations[userId].searchHistory = [];
        break;
      case 'all':
      default:
        delete conversations[userId];
        break;
    }

    memoryDb.conversations = conversations;
    memoryDb.updatedAt = new Date().toISOString();
    await writeDatabase('memory.json', memoryDb);

    return sendSuccess(res, {
      message: `Memory cleared (${clearType})`
    });

  } catch (err) {
    console.error('Memory clear error:', err.message);
    return sendError(res, 'Failed to clear memory', 500);
  }
};


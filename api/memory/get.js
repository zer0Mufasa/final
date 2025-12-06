/**
 * GET /api/memory/get
 * Retrieve conversation memory for a user
 */

const { handleCors, sendSuccess, sendError, readDatabase } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const auth = await requireAuth(req, res);
    
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    const userId = auth.user?.id || auth.shop?.id;

    // Load memory database
    const memoryDb = await readDatabase('memory.json');
    const conversations = memoryDb.conversations || {};

    const userMemory = conversations[userId];

    if (!userMemory) {
      return sendSuccess(res, {
        messages: [],
        imeiHistory: [],
        diagnosticsHistory: [],
        searchHistory: [],
        hasHistory: false
      });
    }

    return sendSuccess(res, {
      messages: userMemory.messages || [],
      imeiHistory: userMemory.imeiHistory || [],
      diagnosticsHistory: userMemory.diagnosticsHistory || [],
      searchHistory: userMemory.searchHistory || [],
      hasHistory: true,
      createdAt: userMemory.createdAt,
      updatedAt: userMemory.updatedAt
    });

  } catch (err) {
    console.error('Memory get error:', err.message);
    return sendError(res, 'Failed to retrieve memory', 500);
  }
};


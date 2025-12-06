/**
 * GET /api/memory/get
 * Get conversation memory for a user
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

    const userId = auth.user?.id;

    // Load memory from Redis
    const memoryDb = await readDatabase('memory.json');
    const conversations = memoryDb.conversations || {};
    const userMemory = conversations[userId];

    if (!userMemory) {
      return sendSuccess(res, {
        memory: {
          messages: [],
          imeiHistory: [],
          diagnosticsHistory: [],
          searchHistory: [],
          priceHistory: []
        }
      });
    }

    return sendSuccess(res, {
      memory: {
        messages: userMemory.messages || [],
        imeiHistory: userMemory.imeiHistory || [],
        diagnosticsHistory: userMemory.diagnosticsHistory || [],
        searchHistory: userMemory.searchHistory || [],
        priceHistory: userMemory.priceHistory || [],
        createdAt: userMemory.createdAt,
        updatedAt: userMemory.updatedAt
      }
    });

  } catch (err) {
    console.error('Memory get error:', err.message);
    return sendError(res, 'Failed to get memory', 500);
  }
};

/**
 * POST /api/memory/save
 * Save conversation memory for a user
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

const MAX_MESSAGES = 20;

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
    const userType = auth.type;

    const body = req.body || {};
    const { message, context, action } = body;

    if (!message) {
      return sendError(res, 'Message is required', 400);
    }

    // Load memory database
    const memoryDb = await readDatabase('memory.json');
    const conversations = memoryDb.conversations || {};

    // Initialize user's conversation history if not exists
    if (!conversations[userId]) {
      conversations[userId] = {
        userType,
        messages: [],
        imeiHistory: [],
        diagnosticsHistory: [],
        searchHistory: [],
        createdAt: new Date().toISOString()
      };
    }

    const userMemory = conversations[userId];

    // Add new message
    userMemory.messages.push({
      content: message,
      role: body.role || 'user',
      context: context || null,
      timestamp: new Date().toISOString()
    });

    // Keep only last MAX_MESSAGES
    if (userMemory.messages.length > MAX_MESSAGES) {
      userMemory.messages = userMemory.messages.slice(-MAX_MESSAGES);
    }

    // Track specific actions
    if (action) {
      switch (action.type) {
        case 'imei_check':
          userMemory.imeiHistory.push({
            imei: action.imei,
            result: action.result,
            timestamp: new Date().toISOString()
          });
          // Keep last 50 IMEI checks
          if (userMemory.imeiHistory.length > 50) {
            userMemory.imeiHistory = userMemory.imeiHistory.slice(-50);
          }
          break;

        case 'diagnostic':
          userMemory.diagnosticsHistory.push({
            device: action.device,
            symptoms: action.symptoms,
            result: action.result,
            timestamp: new Date().toISOString()
          });
          if (userMemory.diagnosticsHistory.length > 50) {
            userMemory.diagnosticsHistory = userMemory.diagnosticsHistory.slice(-50);
          }
          break;

        case 'shop_search':
          userMemory.searchHistory.push({
            location: action.location,
            results: action.results?.length || 0,
            timestamp: new Date().toISOString()
          });
          if (userMemory.searchHistory.length > 50) {
            userMemory.searchHistory = userMemory.searchHistory.slice(-50);
          }
          break;
      }
    }

    userMemory.updatedAt = new Date().toISOString();

    // Save back to database
    memoryDb.conversations = conversations;
    memoryDb.updatedAt = new Date().toISOString();
    await writeDatabase('memory.json', memoryDb);

    return sendSuccess(res, {
      message: 'Memory saved',
      messageCount: userMemory.messages.length
    });

  } catch (err) {
    console.error('Memory save error:', err.message);
    return sendError(res, 'Failed to save memory', 500);
  }
};


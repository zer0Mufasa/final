/**
 * GET /api/auth/profile - Get current user profile
 * POST /api/auth/profile - Update profile
 */

const { handleCors, sendSuccess, sendError, sanitizeInput } = require('../lib/utils');
const { requireAuth, updateUser, updateUserPassword } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const auth = await requireAuth(req, res);
    
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    if (auth.type !== 'user') {
      return sendError(res, 'This endpoint is for customer accounts only', 403);
    }

    // GET - Return profile
    if (req.method === 'GET') {
      return sendSuccess(res, { user: auth.user });
    }

    // POST - Update profile
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const updates = {};
      
      if (body.name !== undefined) {
        updates.name = sanitizeInput(body.name);
      }
      if (body.phone !== undefined) {
        updates.phone = sanitizeInput(body.phone);
      }
      if (body.preferences !== undefined) {
        updates.preferences = {
          ...auth.user.preferences,
          ...body.preferences
        };
      }

      // Handle password change
      if (body.newPassword) {
        if (!body.newPassword || body.newPassword.length < 8) {
          return sendError(res, 'New password must be at least 8 characters', 400);
        }
        await updateUserPassword(auth.user.id, body.newPassword);
      }

      const updatedUser = await updateUser(auth.user.id, updates);

      return sendSuccess(res, {
        message: 'Profile updated successfully',
        user: updatedUser
      });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Profile error:', err.message);
    return sendError(res, 'Failed to process request', 500);
  }
};


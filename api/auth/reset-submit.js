/**
 * POST /api/auth/reset-submit
 * Submit new password with reset token
 */

const { handleCors, sendSuccess, sendError, validatePassword } = require('../lib/utils');
const { validateResetToken, consumeResetToken, findUserByEmail, updateUserPassword, findShopByEmail } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body || {};
    const { token, password } = body;

    if (!token) {
      return sendError(res, 'Reset token is required', 400);
    }

    if (!validatePassword(password)) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    // Validate token
    const tokenData = await validateResetToken(token);

    if (!tokenData) {
      return sendError(res, 'Invalid or expired reset token', 400);
    }

    // Find user or shop
    let userId = null;

    if (tokenData.type === 'user') {
      const user = await findUserByEmail(tokenData.email);
      if (user) {
        userId = user.id;
        await updateUserPassword(userId, password);
      }
    } else if (tokenData.type === 'shop') {
      const shop = await findShopByEmail(tokenData.email);
      if (shop) {
        // Shop password update would go here
        // For now, we'll use the same function pattern
      }
    }

    if (!userId) {
      return sendError(res, 'Account not found', 404);
    }

    // Consume the token so it can't be reused
    await consumeResetToken(token);

    console.log(`Password reset completed for: ${tokenData.email}`);

    return sendSuccess(res, {
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (err) {
    console.error('Reset submit error:', err.message);
    return sendError(res, 'Failed to reset password', 500);
  }
};


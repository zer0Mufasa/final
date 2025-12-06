/**
 * POST /api/auth/reset-request
 * Request password reset email
 */

const { handleCors, sendSuccess, sendError, validateEmail, sanitizeInput } = require('../lib/utils');
const { findUserByEmail, createResetToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body || {};
    const email = sanitizeInput(body.email || '');

    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    const user = await findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return sendSuccess(res, {
        message: 'If an account exists with this email, a reset link will be sent.'
      });
    }

    // Create reset token
    const token = await createResetToken(email, 'user');

    // In production, send email here
    // For now, just log the token
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: https://fixologyai.com/reset-password.html?token=${token}`);

    return sendSuccess(res, {
      message: 'If an account exists with this email, a reset link will be sent.',
      // Include token in dev mode only
      ...(process.env.NODE_ENV === 'development' ? { token } : {})
    });

  } catch (err) {
    console.error('Reset request error:', err.message);
    return sendError(res, 'Failed to process request', 500);
  }
};


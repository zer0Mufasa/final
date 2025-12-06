/**
 * POST /api/auth/login
 * Customer login
 */

const { handleCors, sendSuccess, sendError, validateRequired, sanitizeInput } = require('../lib/utils');
const { loginUser } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body || {};
    
    // Validate required fields
    const missing = validateRequired(body, ['email', 'password']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const email = sanitizeInput(body.email);
    const password = body.password;

    // Login user
    const result = await loginUser(email, password);

    console.log(`User logged in: ${email}`);

    return sendSuccess(res, {
      message: 'Login successful',
      user: result.user,
      token: result.token
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return sendError(res, err.message || 'Login failed', 401);
  }
};

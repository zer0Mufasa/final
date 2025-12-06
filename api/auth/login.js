/**
 * POST /api/auth/login
 * Customer account login
 */

const { handleCors, sendSuccess, sendError, validateEmail, validateRequired, sanitizeInput, appendToLog } = require('../lib/utils');
const { authenticateUser } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body || {};
    
    const missing = validateRequired(body, ['email', 'password']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const email = sanitizeInput(body.email);
    const password = body.password;

    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    const { user, token } = await authenticateUser(email, password);

    // Log login
    await appendToLog('auth-log.json', {
      type: 'login',
      email: user.email,
      userId: user.id,
      ip: req.headers['x-forwarded-for'] || 'unknown'
    });

    console.log(`User logged in: ${email}`);

    return sendSuccess(res, {
      message: 'Login successful',
      user,
      token
    });

  } catch (err) {
    console.error('Login error:', err.message);
    
    if (err.message === 'Invalid email or password') {
      return sendError(res, err.message, 401);
    }
    
    return sendError(res, 'Login failed', 500);
  }
};


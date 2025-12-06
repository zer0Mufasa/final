/**
 * POST /api/auth/signup
 * Customer account registration
 */

const { handleCors, sendSuccess, sendError, validateEmail, validatePassword, validateRequired, sanitizeInput } = require('../lib/utils');
const { createUser } = require('../lib/auth');

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
    const name = sanitizeInput(body.name || '');
    const phone = sanitizeInput(body.phone || '');

    // Validate email format
    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    // Create user
    const user = await createUser({
      email,
      password,
      name,
      phone
    });

    console.log(`New user registered: ${email}`);

    return sendSuccess(res, {
      message: 'Account created successfully',
      user
    }, 201);

  } catch (err) {
    console.error('Signup error:', err.message);
    
    if (err.message === 'Email already registered') {
      return sendError(res, err.message, 409);
    }
    
    return sendError(res, 'Failed to create account', 500);
  }
};


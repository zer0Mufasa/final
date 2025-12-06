/**
 * POST /api/shops/register
 * Shop owner registration
 */

const { handleCors, sendSuccess, sendError, validateEmail, validatePassword, validateRequired, sanitizeInput } = require('../lib/utils');
const { createShop } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body || {};
    
    // Validate required fields
    const missing = validateRequired(body, ['email', 'password', 'shopName']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const email = sanitizeInput(body.email);
    const password = body.password;
    const shopName = sanitizeInput(body.shopName);
    const ownerName = sanitizeInput(body.ownerName || '');
    const address = sanitizeInput(body.address || '');
    const city = sanitizeInput(body.city || '');
    const state = sanitizeInput(body.state || '');
    const zipcode = sanitizeInput(body.zipcode || '');
    const phone = sanitizeInput(body.phone || '');
    const website = sanitizeInput(body.website || '');

    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email format', 400);
    }

    if (!validatePassword(password)) {
      return sendError(res, 'Password must be at least 8 characters', 400);
    }

    const result = await createShop({
      email,
      password,
      shopName,
      ownerName,
      address,
      city,
      state,
      zipcode,
      phone,
      website
    });

    console.log(`New shop registered: ${shopName} (${email})`);

    return sendSuccess(res, {
      message: 'Shop account created successfully',
      shop: result,
      token: result.token
    }, 201);

  } catch (err) {
    console.error('Shop registration error:', err.message);
    
    if (err.message === 'Email already registered') {
      return sendError(res, err.message, 409);
    }
    
    return sendError(res, 'Failed to create shop account', 500);
  }
};

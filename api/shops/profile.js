/**
 * GET /api/shops/profile - Get shop profile
 * POST /api/shops/profile - Update shop profile
 */

const { handleCors, sendSuccess, sendError, sanitizeInput } = require('../lib/utils');
const { requireAuth, updateShop } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const auth = await requireAuth(req, res);
    
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    if (auth.type !== 'shop') {
      return sendError(res, 'This endpoint is for shop accounts only', 403);
    }

    // GET - Return profile
    if (req.method === 'GET') {
      return sendSuccess(res, { shop: auth.shop });
    }

    // POST - Update profile
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const updates = {};
      
      const allowedFields = [
        'shopName', 'ownerName', 'address', 'city', 'state', 'zipcode',
        'phone', 'website', 'businessHours', 'services'
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          if (typeof body[field] === 'string') {
            updates[field] = sanitizeInput(body[field]);
          } else {
            updates[field] = body[field];
          }
        }
      }

      const updatedShop = await updateShop(auth.shop.id, updates);

      return sendSuccess(res, {
        message: 'Profile updated successfully',
        shop: updatedShop
      });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Shop profile error:', err.message);
    return sendError(res, 'Failed to process request', 500);
  }
};


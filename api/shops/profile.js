/**
 * GET/POST /api/shops/profile
 * Shop owner profile management
 */

const { handleCors, sendSuccess, sendError, sanitizeInput } = require('../lib/utils');
const { requireAuth, updateShop, getShopById } = require('../lib/auth');

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

    const shop = auth.user;

    // GET - Return profile
    if (req.method === 'GET') {
      return sendSuccess(res, { shop });
    }

    // POST/PUT - Update profile
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      
      const updates = {};
      
      // Allowed fields to update
      const allowedFields = ['shopName', 'ownerName', 'address', 'city', 'state', 'zipcode', 'phone', 'website', 'description', 'services', 'hours'];
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = sanitizeInput(body[field]);
        }
      }

      const updatedShop = await updateShop(shop.id, updates);

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

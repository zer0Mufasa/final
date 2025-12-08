/**
 * Inventory API
 * GET /api/inventory - List all items
 * GET /api/inventory/low-stock - Get low stock items
 * GET /api/inventory/:id - Get single item
 * POST /api/inventory - Add new part
 * PUT /api/inventory/:id - Update part
 * PATCH /api/inventory/:id/stock - Quick stock adjustment
 * DELETE /api/inventory/:id - Delete part
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase, generateUUID, sanitizeInput, validateRequired, extractId } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const auth = await requireAuth(req, res);
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    const shopId = auth.shop?.id || auth.user?.id;
    if (!shopId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const db = await readDatabase('inventory.json');
    let inventory = db.inventory || [];

    // Filter by shop_id
    inventory = inventory.filter(i => i.shop_id === shopId);

    // GET /api/inventory/low-stock
    if (req.method === 'GET' && req.query.lowStock) {
      const lowStock = inventory.filter(item => item.current_stock <= item.min_stock);
      return sendSuccess(res, { items: lowStock, count: lowStock.length });
    }

    // GET /api/inventory - List all
    if (req.method === 'GET' && !req.query.id) {
      const { search, category, lowStockOnly, page = 1, limit = 50 } = req.query;

      let filtered = [...inventory];

      // Filter by category
      if (category) {
        filtered = filtered.filter(i => i.category === category);
      }

      // Filter low stock only
      if (lowStockOnly === 'true') {
        filtered = filtered.filter(i => i.current_stock <= i.min_stock);
      }

      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(i => 
          i.name?.toLowerCase().includes(searchLower) ||
          i.sku?.toLowerCase().includes(searchLower) ||
          i.supplier?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by name
      filtered.sort((a, b) => a.name.localeCompare(b.name));

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginated = filtered.slice(start, end);

      return sendSuccess(res, {
        inventory: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum)
        }
      });
    }

    // GET /api/inventory/:id
    const itemId = extractId(req);
    if (req.method === 'GET' && itemId) {
      const item = inventory.find(i => i.id === itemId);
      if (!item) {
        return sendError(res, 'Item not found', 404);
      }
      return sendSuccess(res, { item });
    }

    // POST /api/inventory - Create
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const missing = validateRequired(body, ['name', 'sku', 'cost_price', 'sell_price']);
      if (missing.length > 0) {
        return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Check if SKU already exists
      if (inventory.some(i => i.sku === body.sku)) {
        return sendError(res, 'SKU already exists', 400);
      }

      const newItem = {
        id: generateUUID(),
        shop_id: shopId,
        sku: sanitizeInput(body.sku),
        name: sanitizeInput(body.name),
        category: sanitizeInput(body.category || ''),
        cost_price: parseFloat(body.cost_price),
        sell_price: parseFloat(body.sell_price),
        current_stock: parseInt(body.current_stock || 0),
        min_stock: parseInt(body.min_stock || 5),
        supplier: sanitizeInput(body.supplier || ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      inventory.push(newItem);
      await writeDatabase('inventory.json', { inventory, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { item: newItem }, 201);
    }

    // PUT /api/inventory/:id - Update
    if (req.method === 'PUT' && itemId) {
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return sendError(res, 'Item not found', 404);
      }

      const body = req.body || {};
      const item = inventory[itemIndex];

      // Update allowed fields
      const allowedFields = ['name', 'category', 'cost_price', 'sell_price', 'current_stock', 'min_stock', 'supplier'];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          if (field.includes('price') || field.includes('stock')) {
            item[field] = parseFloat(body[field]);
          } else if (typeof body[field] === 'string') {
            item[field] = sanitizeInput(body[field]);
          } else {
            item[field] = body[field];
          }
        }
      });

      item.updated_at = new Date().toISOString();
      inventory[itemIndex] = item;
      await writeDatabase('inventory.json', { inventory, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { item });
    }

    // PATCH /api/inventory/:id/stock - Quick stock adjustment
    if (req.method === 'PATCH' && itemId && req.body.adjustment !== undefined) {
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return sendError(res, 'Item not found', 404);
      }

      const adjustment = parseInt(req.body.adjustment);
      inventory[itemIndex].current_stock += adjustment;
      inventory[itemIndex].updated_at = new Date().toISOString();

      await writeDatabase('inventory.json', { inventory, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { item: inventory[itemIndex] });
    }

    // DELETE /api/inventory/:id
    if (req.method === 'DELETE' && itemId) {
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return sendError(res, 'Item not found', 404);
      }

      inventory.splice(itemIndex, 1);
      await writeDatabase('inventory.json', { inventory, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { message: 'Item deleted' });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Inventory API error:', err);
    return sendError(res, 'Failed to process request', 500);
  }
};

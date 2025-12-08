/**
 * Customers API
 * GET /api/customers - List all customers
 * GET /api/customers/:id - Get single customer
 * GET /api/customers/:id/tickets - Get customer tickets
 * POST /api/customers - Create customer
 * PUT /api/customers/:id - Update customer
 * DELETE /api/customers/:id - Delete customer (soft delete)
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase, generateUUID, sanitizeInput, validateRequired, validateEmail, extractId } = require('../lib/utils');
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

    const db = await readDatabase('customers.json');
    let customers = db.customers || [];

    // Filter by shop_id
    customers = customers.filter(c => c.shop_id === shopId);

    // GET /api/customers - List all
    if (req.method === 'GET' && !req.query.id) {
      const { search, status, page = 1, limit = 50 } = req.query;

      let filtered = [...customers];

      // Filter by status
      if (status && status !== 'all') {
        filtered = filtered.filter(c => c.status === status);
      }

      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(c => 
          c.first_name?.toLowerCase().includes(searchLower) ||
          c.last_name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.includes(search)
        );
      }

      // Sort by last_visit desc
      filtered.sort((a, b) => {
        const dateA = a.last_visit ? new Date(a.last_visit) : new Date(a.created_at);
        const dateB = b.last_visit ? new Date(b.last_visit) : new Date(b.created_at);
        return dateB - dateA;
      });

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginated = filtered.slice(start, end);

      return sendSuccess(res, {
        customers: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum)
        }
      });
    }

    // GET /api/customers/:id - Get single
    const customerId = extractId(req);
    if (req.method === 'GET' && customerId && !req.query.tickets) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        return sendError(res, 'Customer not found', 404);
      }
      return sendSuccess(res, { customer });
    }

    // GET /api/customers/:id/tickets - Get customer tickets
    if (req.method === 'GET' && customerId && req.query.tickets) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        return sendError(res, 'Customer not found', 404);
      }

      const ticketsDb = await readDatabase('tickets.json');
      const tickets = (ticketsDb.tickets || []).filter(t => 
        t.customer_id === customerId && t.shop_id === shopId
      );

      return sendSuccess(res, { tickets });
    }

    // POST /api/customers - Create
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const missing = validateRequired(body, ['first_name', 'last_name', 'phone']);
      if (missing.length > 0) {
        return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Validate email if provided
      if (body.email && !validateEmail(body.email)) {
        return sendError(res, 'Invalid email format', 400);
      }

      // Check if email already exists
      if (body.email && customers.some(c => c.email?.toLowerCase() === body.email.toLowerCase())) {
        return sendError(res, 'Email already registered', 400);
      }

      const newCustomer = {
        id: generateUUID(),
        shop_id: shopId,
        first_name: sanitizeInput(body.first_name),
        last_name: sanitizeInput(body.last_name),
        email: body.email ? sanitizeInput(body.email.toLowerCase()) : null,
        phone: sanitizeInput(body.phone),
        address: sanitizeInput(body.address || ''),
        notes: sanitizeInput(body.notes || ''),
        status: body.status || 'active',
        total_repairs: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        last_visit: null
      };

      customers.push(newCustomer);
      await writeDatabase('customers.json', { customers, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { customer: newCustomer }, 201);
    }

    // PUT /api/customers/:id - Update
    if (req.method === 'PUT' && customerId) {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        return sendError(res, 'Customer not found', 404);
      }

      const body = req.body || {};
      const customer = customers[customerIndex];

      // Update allowed fields
      const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'address', 'notes', 'status'];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          if (field === 'email' && body[field] && !validateEmail(body[field])) {
            return sendError(res, 'Invalid email format', 400);
          }
          if (typeof body[field] === 'string') {
            customer[field] = sanitizeInput(body[field]);
            if (field === 'email') customer[field] = customer[field].toLowerCase();
          } else {
            customer[field] = body[field];
          }
        }
      });

      // Update last_visit if status changed to active
      if (body.status === 'active' && customer.status !== 'active') {
        customer.last_visit = new Date().toISOString();
      }

      customers[customerIndex] = customer;
      await writeDatabase('customers.json', { customers, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { customer });
    }

    // DELETE /api/customers/:id - Soft delete
    if (req.method === 'DELETE' && customerId) {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        return sendError(res, 'Customer not found', 404);
      }

      customers[customerIndex].status = 'inactive';
      await writeDatabase('customers.json', { customers, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { message: 'Customer deactivated' });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Customers API error:', err);
    return sendError(res, 'Failed to process request', 500);
  }
};

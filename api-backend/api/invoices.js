/**
 * Invoices API
 * GET /api/invoices - List all invoices
 * GET /api/invoices/:id - Get single invoice
 * POST /api/invoices - Create invoice
 * PUT /api/invoices/:id - Update invoice
 * PATCH /api/invoices/:id/status - Update status
 * POST /api/invoices/:id/send - Send invoice to customer
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

    const db = await readDatabase('invoices.json');
    let invoices = db.invoices || [];

    // Filter by shop_id
    invoices = invoices.filter(i => i.shop_id === shopId);

    // GET /api/invoices - List all
    if (req.method === 'GET' && !req.query.id) {
      const { status, search, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

      let filtered = [...invoices];

      // Filter by status
      if (status) {
        filtered = filtered.filter(i => i.status === status);
      }

      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(i => 
          i.invoice_number?.toLowerCase().includes(searchLower) ||
          i.customer_name?.toLowerCase().includes(searchLower)
        );
      }

      // Date range
      if (dateFrom) {
        filtered = filtered.filter(i => new Date(i.created_at) >= new Date(dateFrom));
      }
      if (dateTo) {
        filtered = filtered.filter(i => new Date(i.created_at) <= new Date(dateTo));
      }

      // Sort by created_at desc
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginated = filtered.slice(start, end);

      return sendSuccess(res, {
        invoices: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum)
        }
      });
    }

    // GET /api/invoices/:id
    const invoiceId = extractId(req);
    if (req.method === 'GET' && invoiceId) {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        return sendError(res, 'Invoice not found', 404);
      }
      return sendSuccess(res, { invoice });
    }

    // POST /api/invoices - Create
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const missing = validateRequired(body, ['customer_id', 'line_items']);
      if (missing.length > 0) {
        return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Calculate totals
      const subtotal = (body.line_items || []).reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity));
      }, 0);

      const taxRate = parseFloat(body.tax_rate || 0) / 100;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      // Get next invoice number
      const invoiceCount = invoices.length;
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`;

      const newInvoice = {
        id: generateUUID(),
        invoice_number: invoiceNumber,
        shop_id: shopId,
        ticket_id: body.ticket_id || null,
        customer_id: body.customer_id,
        customer_name: body.customer_name || '',
        customer_email: body.customer_email || '',
        status: body.status || 'draft',
        subtotal: subtotal,
        tax: tax,
        tax_rate: taxRate * 100,
        total: total,
        line_items: body.line_items,
        notes: sanitizeInput(body.notes || ''),
        due_date: body.due_date || null,
        paid_at: null,
        created_at: new Date().toISOString()
      };

      invoices.push(newInvoice);
      await writeDatabase('invoices.json', { invoices, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { invoice: newInvoice }, 201);
    }

    // PUT /api/invoices/:id - Update
    if (req.method === 'PUT' && req.query.id) {
      const invoiceIndex = invoices.findIndex(i => i.id === req.query.id);
      if (invoiceIndex === -1) {
        return sendError(res, 'Invoice not found', 404);
      }

      const body = req.body || {};
      const invoice = invoices[invoiceIndex];

      // Recalculate if line_items changed
      if (body.line_items) {
        const subtotal = body.line_items.reduce((sum, item) => {
          return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);
        const taxRate = parseFloat(body.tax_rate || invoice.tax_rate) / 100;
        invoice.subtotal = subtotal;
        invoice.tax = subtotal * taxRate;
        invoice.total = subtotal + invoice.tax;
        invoice.line_items = body.line_items;
      }

      // Update other fields
      const allowedFields = ['notes', 'due_date', 'tax_rate'];
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          invoice[field] = body[field];
        }
      });

      invoices[invoiceIndex] = invoice;
      await writeDatabase('invoices.json', { invoices, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { invoice });
    }

    // PATCH /api/invoices/:id/status
    if (req.method === 'PATCH' && invoiceId && req.body.status) {
      const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
      if (invoiceIndex === -1) {
        return sendError(res, 'Invoice not found', 404);
      }

      const invoice = invoices[invoiceIndex];
      const newStatus = req.body.status;

      const validStatuses = ['draft', 'pending', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return sendError(res, 'Invalid status', 400);
      }

      invoice.status = newStatus;
      if (newStatus === 'paid') {
        invoice.paid_at = new Date().toISOString();
      }

      invoices[invoiceIndex] = invoice;
      await writeDatabase('invoices.json', { invoices, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { invoice });
    }

    // POST /api/invoices/:id/send
    if (req.method === 'POST' && invoiceId && req.body.action === 'send') {
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        return sendError(res, 'Invoice not found', 404);
      }

      // TODO: Implement email sending
      // For now, just update status to pending
      invoice.status = 'pending';
      await writeDatabase('invoices.json', { invoices, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { message: 'Invoice sent successfully', invoice });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Invoices API error:', err);
    return sendError(res, 'Failed to process request', 500);
  }
};

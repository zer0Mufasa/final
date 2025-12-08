/**
 * Tickets API
 * GET /api/tickets - List all tickets
 * GET /api/tickets/:id - Get single ticket
 * POST /api/tickets - Create new ticket
 * PUT /api/tickets/:id - Update ticket
 * PATCH /api/tickets/:id/status - Update ticket status
 * DELETE /api/tickets/:id - Delete ticket
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

    const db = await readDatabase('tickets.json');
    let tickets = db.tickets || [];

    // Filter by shop_id if shop user
    if (auth.type === 'shop') {
      tickets = tickets.filter(t => t.shop_id === shopId);
    }

    // GET /api/tickets - List all
    if (req.method === 'GET' && !req.query.id) {
      const { status, search, priority, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

      let filtered = [...tickets];

      // Filter by status
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }

      // Filter by priority
      if (priority) {
        filtered = filtered.filter(t => t.priority === priority);
      }

      // Search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(t => 
          t.ticket_number?.toLowerCase().includes(searchLower) ||
          t.customer_name?.toLowerCase().includes(searchLower) ||
          t.device_type?.toLowerCase().includes(searchLower) ||
          t.device_issue?.toLowerCase().includes(searchLower)
        );
      }

      // Date range
      if (dateFrom) {
        filtered = filtered.filter(t => new Date(t.created_at) >= new Date(dateFrom));
      }
      if (dateTo) {
        filtered = filtered.filter(t => new Date(t.created_at) <= new Date(dateTo));
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
        tickets: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum)
        }
      });
    }

    // GET /api/tickets/:id - Get single
    const ticketId = extractId(req);
    if (req.method === 'GET' && ticketId) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        return sendError(res, 'Ticket not found', 404);
      }
      return sendSuccess(res, { ticket });
    }

    // POST /api/tickets - Create
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const missing = validateRequired(body, ['device_type', 'device_issue']);
      if (missing.length > 0) {
        return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
      }

      // Get next ticket number
      const ticketCount = tickets.length;
      const ticketNumber = `TK-${String(ticketCount + 1).padStart(4, '0')}`;

      const newTicket = {
        id: generateUUID(),
        ticket_number: ticketNumber,
        shop_id: shopId,
        customer_id: body.customer_id || null,
        customer_name: body.customer_name || '',
        customer_phone: body.customer_phone || '',
        device_type: sanitizeInput(body.device_type),
        device_issue: sanitizeInput(body.device_issue),
        status: body.status || 'check-in',
        priority: body.priority || 'normal',
        quoted_price: parseFloat(body.quoted_price) || 0,
        final_price: 0,
        technician_id: body.technician_id || null,
        notes: sanitizeInput(body.notes || ''),
        diagnosis_notes: sanitizeInput(body.diagnosis_notes || ''),
        parts_used: body.parts_used || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        estimated_completion: body.estimated_completion || null
      };

      tickets.push(newTicket);
      await writeDatabase('tickets.json', { tickets, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { ticket: newTicket }, 201);
    }

    // PUT /api/tickets/:id - Update
    const updateTicketId = extractId(req);
    if (req.method === 'PUT' && updateTicketId) {
      const ticketIndex = tickets.findIndex(t => t.id === updateTicketId);
      if (ticketIndex === -1) {
        return sendError(res, 'Ticket not found', 404);
      }

      const body = req.body || {};
      const ticket = tickets[ticketIndex];

      // Update allowed fields
      const allowedFields = [
        'customer_id', 'customer_name', 'customer_phone', 'device_type', 'device_issue',
        'priority', 'quoted_price', 'final_price', 'technician_id', 'notes', 'diagnosis_notes',
        'parts_used', 'estimated_completion'
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          if (typeof body[field] === 'string') {
            ticket[field] = sanitizeInput(body[field]);
          } else {
            ticket[field] = body[field];
          }
        }
      });

      ticket.updated_at = new Date().toISOString();
      tickets[ticketIndex] = ticket;
      await writeDatabase('tickets.json', { tickets, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { ticket });
    }

    // PATCH /api/tickets/:id/status - Update status
    const patchTicketId = extractId(req);
    if (req.method === 'PATCH' && patchTicketId && req.body.status) {
      const ticketIndex = tickets.findIndex(t => t.id === patchTicketId);
      if (ticketIndex === -1) {
        return sendError(res, 'Ticket not found', 404);
      }

      const ticket = tickets[ticketIndex];
      const newStatus = req.body.status;

      const validStatuses = ['check-in', 'diagnosis', 'in-repair', 'ready', 'pickup', 'completed'];
      if (!validStatuses.includes(newStatus)) {
        return sendError(res, 'Invalid status', 400);
      }

      ticket.status = newStatus;
      ticket.updated_at = new Date().toISOString();

      if (newStatus === 'completed') {
        ticket.completed_at = new Date().toISOString();
        ticket.final_price = ticket.final_price || ticket.quoted_price || 0;
      }

      tickets[ticketIndex] = ticket;
      await writeDatabase('tickets.json', { tickets, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { ticket });
    }

    // DELETE /api/tickets/:id
    const deleteTicketId = extractId(req);
    if (req.method === 'DELETE' && deleteTicketId) {
      const ticketIndex = tickets.findIndex(t => t.id === deleteTicketId);
      if (ticketIndex === -1) {
        return sendError(res, 'Ticket not found', 404);
      }

      tickets.splice(ticketIndex, 1);
      await writeDatabase('tickets.json', { tickets, updatedAt: new Date().toISOString() });

      return sendSuccess(res, { message: 'Ticket deleted' });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Tickets API error:', err);
    return sendError(res, 'Failed to process request', 500);
  }
};

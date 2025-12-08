/**
 * Dashboard Stats API
 * GET /api/dashboard/stats - Get dashboard statistics
 */

const { handleCors, sendSuccess, sendError, readDatabase } = require('../lib/utils');
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

    // GET /api/dashboard/stats
    if (req.method === 'GET') {
      // Load all data
      const ticketsDb = await readDatabase('tickets.json');
      const invoicesDb = await readDatabase('invoices.json');
      const inventoryDb = await readDatabase('inventory.json');
      const customersDb = await readDatabase('customers.json');

      const tickets = (ticketsDb.tickets || []).filter(t => t.shop_id === shopId);
      const invoices = (invoicesDb.invoices || []).filter(i => i.shop_id === shopId);
      const inventory = (inventoryDb.inventory || []).filter(i => i.shop_id === shopId);
      const customers = (customersDb.customers || []).filter(c => c.shop_id === shopId);

      // Today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Active tickets (not completed)
      const activeTickets = tickets.filter(t => 
        t.status !== 'completed' && t.status !== 'pickup'
      );

      // Completed today
      const completedToday = tickets.filter(t => {
        if (!t.completed_at) return false;
        const completedDate = new Date(t.completed_at);
        return completedDate >= today && completedDate < tomorrow;
      });

      // Today's revenue (from paid invoices)
      const todayRevenue = invoices
        .filter(i => {
          if (i.status !== 'paid') return false;
          const paidDate = new Date(i.paid_at);
          return paidDate >= today && paidDate < tomorrow;
        })
        .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

      // Average repair time (in minutes)
      const completedTickets = tickets.filter(t => t.completed_at);
      let avgRepairTime = 0;
      if (completedTickets.length > 0) {
        const totalMinutes = completedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const completed = new Date(t.completed_at);
          const diffMinutes = (completed - created) / (1000 * 60);
          return sum + diffMinutes;
        }, 0);
        avgRepairTime = Math.round(totalMinutes / completedTickets.length);
      }

      // Tickets by status
      const ticketsByStatus = {
        'check-in': tickets.filter(t => t.status === 'check-in').length,
        'diagnosis': tickets.filter(t => t.status === 'diagnosis').length,
        'in-repair': tickets.filter(t => t.status === 'in-repair').length,
        'ready': tickets.filter(t => t.status === 'ready').length,
        'pickup': tickets.filter(t => t.status === 'pickup').length,
        'completed': tickets.filter(t => t.status === 'completed').length
      };

      // Revenue by day (last 7 days)
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRevenue = invoices
          .filter(i => {
            if (i.status !== 'paid' || !i.paid_at) return false;
            const paidDate = new Date(i.paid_at);
            return paidDate >= date && paidDate < nextDate;
          })
          .reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        revenueByDay.push({
          day: dayNames[date.getDay()],
          date: date.toISOString().split('T')[0],
          amount: dayRevenue
        });
      }

      // Low stock count
      const lowStockCount = inventory.filter(i => i.current_stock <= i.min_stock).length;

      // Pending invoices
      const pendingInvoices = invoices.filter(i => 
        i.status === 'pending' || i.status === 'overdue'
      ).length;

      return sendSuccess(res, {
        activeTickets: activeTickets.length,
        completedToday: completedToday.length,
        todayRevenue: todayRevenue,
        avgRepairTime: `${avgRepairTime}m`,
        ticketsByStatus,
        revenueByDay,
        lowStockCount,
        pendingInvoices
      });
    }

    return sendError(res, 'Method not allowed', 405);

  } catch (err) {
    console.error('Dashboard API error:', err);
    return sendError(res, 'Failed to process request', 500);
  }
};

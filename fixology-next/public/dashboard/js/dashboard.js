/**
 * Dashboard Page JavaScript
 * Loads stats, ticket pipeline, revenue chart, and handles interactions
 */

const { apiCall, showToast, formatCurrency, formatDate } = window.FixologyApp;

// ═══════════════════════════════════════════════════════════════════
// LOAD DASHBOARD DATA
// ═══════════════════════════════════════════════════════════════════

async function loadDashboard() {
  try {
    // Load stats
    const stats = await apiCall('/api/dashboard/stats');
    updateStats(stats);

    // Load tickets for pipeline
    const ticketsData = await apiCall('/api/tickets?limit=100');
    updateTicketPipeline(ticketsData.tickets || []);

    // Update revenue chart
    updateRevenueChart(stats.revenueByDay || []);

    // Load recent tickets
    updateRecentTickets(ticketsData.tickets || []);

  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE STATS CARDS
// ═══════════════════════════════════════════════════════════════════

function updateStats(stats) {
  // Active Tickets
  const activeEl = document.getElementById('stat-active');
  if (activeEl) {
    animateNumber(activeEl, parseInt(activeEl.textContent) || 0, stats.activeTickets || 0);
  }

  // Completed Today
  const completedEl = document.getElementById('stat-completed');
  if (completedEl) {
    animateNumber(completedEl, parseInt(completedEl.textContent) || 0, stats.completedToday || 0);
  }

  // Today's Revenue
  const revenueEl = document.getElementById('stat-revenue');
  if (revenueEl) {
    revenueEl.textContent = formatCurrency(stats.todayRevenue || 0);
  }

  // Avg Repair Time
  const avgTimeEl = document.getElementById('stat-avgtime');
  if (avgTimeEl) {
    avgTimeEl.textContent = stats.avgRepairTime || '0m';
  }
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE TICKET PIPELINE
// ═══════════════════════════════════════════════════════════════════

function updateTicketPipeline(tickets) {
  const statusMap = {
    'check-in': 'pipe-checkin',
    'diagnosis': 'pipe-diag',
    'in-repair': 'pipe-repair',
    'ready': 'pipe-ready',
    'pickup': 'pipe-pickup'
  };

  // Count tickets by status
  const counts = {
    'check-in': 0,
    'diagnosis': 0,
    'in-repair': 0,
    'ready': 0,
    'pickup': 0
  };

  tickets.forEach(ticket => {
    if (counts.hasOwnProperty(ticket.status)) {
      counts[ticket.status]++;
    }
  });

  // Update counts
  Object.entries(statusMap).forEach(([status, elementId]) => {
    const el = document.getElementById(elementId);
    if (el) {
      animateNumber(el, parseInt(el.textContent) || 0, counts[status]);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE REVENUE CHART
// ═══════════════════════════════════════════════════════════════════

function updateRevenueChart(revenueData) {
  const chartContainer = document.getElementById('revenue-chart');
  if (!chartContainer) return;

  if (revenueData.length === 0) {
    chartContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">No revenue data</div>';
    return;
  }

  const maxAmount = Math.max(...revenueData.map(d => d.amount), 1);

  chartContainer.innerHTML = revenueData.map(day => {
    const height = (day.amount / maxAmount) * 100;
    return `
      <div class="chart-bar" style="height:${height}%" title="${day.day}: ${formatCurrency(day.amount)}">
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// UPDATE RECENT TICKETS
// ═══════════════════════════════════════════════════════════════════

function updateRecentTickets(tickets) {
  const container = document.getElementById('recent-tickets');
  if (!container) return;

  // Get recent 5 tickets
  const recent = tickets
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="ticket-item">
        <div class="ticket-avatar">📱</div>
        <div class="ticket-info">
          <div class="ticket-customer">No tickets yet</div>
          <div class="ticket-device">Create your first ticket to get started</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = recent.map(ticket => {
    const statusClass = getStatusClass(ticket.status);
    return `
      <div class="ticket-item" onclick="window.location.href='tickets.html?id=${ticket.id}'">
        <div class="ticket-avatar">📱</div>
        <div class="ticket-info">
          <div class="ticket-customer">${ticket.customer_name || 'Walk-in'}</div>
          <div class="ticket-device">${ticket.device_type}</div>
        </div>
        <div class="ticket-meta">
          <div class="ticket-amount">${formatCurrency(ticket.quoted_price || 0)}</div>
          <div class="ticket-status ${statusClass}">${getStatusLabel(ticket.status)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
// NEW TICKET MODAL
// ═══════════════════════════════════════════════════════════════════

function openNewTicketModal() {
  const modal = document.getElementById('new-ticket-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeNewTicketModal() {
  const modal = document.getElementById('new-ticket-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Reset form
    const form = document.getElementById('new-ticket-form');
    if (form) form.reset();
  }
}

async function createTicket(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  const ticketData = {
    customer_name: formData.get('customer_name'),
    customer_phone: formData.get('customer_phone'),
    device_type: formData.get('device_type'),
    device_issue: formData.get('device_issue'),
    priority: formData.get('priority') || 'normal',
    quoted_price: formData.get('quoted_price') || 0,
    notes: formData.get('notes') || ''
  };

  try {
    const result = await apiCall('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });

    showToast('Ticket created successfully!', 'success');
    closeNewTicketModal();
    loadDashboard(); // Refresh dashboard
  } catch (error) {
    console.error('Error creating ticket:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function animateNumber(element, from, to) {
  const duration = 500;
  const steps = 30;
  const increment = (to - from) / steps;
  let current = from;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current += increment;
    if (step >= steps) {
      element.textContent = to;
      clearInterval(timer);
    } else {
      element.textContent = Math.round(current);
    }
  }, duration / steps);
}

function getStatusClass(status) {
  const map = {
    'check-in': 'status-open',
    'diagnosis': 'status-diag',
    'in-repair': 'status-waiting',
    'ready': 'status-ready',
    'pickup': 'status-ready',
    'completed': 'status-ready'
  };
  return map[status] || 'status-open';
}

function getStatusLabel(status) {
  const map = {
    'check-in': 'Check-in',
    'diagnosis': 'Diagnosis',
    'in-repair': 'In Repair',
    'ready': 'Ready',
    'pickup': 'Pickup',
    'completed': 'Completed'
  };
  return map[status] || status;
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  
  // Auto-refresh every 60 seconds
  setInterval(loadDashboard, 60000);

  // Setup new ticket form
  const form = document.getElementById('new-ticket-form');
  if (form) {
    form.addEventListener('submit', createTicket);
  }

  // Setup new ticket button
  const newTicketBtn = document.querySelector('.btn-primary');
  if (newTicketBtn && newTicketBtn.textContent.includes('New Ticket')) {
    newTicketBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openNewTicketModal();
    });
  }
});

// Export for global access
window.openNewTicketModal = openNewTicketModal;
window.closeNewTicketModal = closeNewTicketModal;

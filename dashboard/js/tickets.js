/**
 * Tickets Page JavaScript
 * Kanban board with drag-drop functionality
 */

const { apiCall, showToast, formatCurrency, formatDate } = window.FixologyApp;

let tickets = [];
let draggedTicket = null;

// ═══════════════════════════════════════════════════════════════════
// LOAD TICKETS
// ═══════════════════════════════════════════════════════════════════

async function loadTickets() {
  try {
    const data = await apiCall('/api/tickets?limit=1000');
    tickets = data.tickets || [];
    renderKanbanBoard();
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER KANBAN BOARD
// ═══════════════════════════════════════════════════════════════════

function renderKanbanBoard() {
  const statuses = ['check-in', 'diagnosis', 'in-repair', 'ready', 'pickup'];
  
  statuses.forEach(status => {
    const column = document.querySelector(`.column.stage-${status} .column-body`);
    if (!column) return;
    
    const statusTickets = tickets.filter(t => t.status === status);
    const countEl = document.querySelector(`.column.stage-${status} .column-count`);
    if (countEl) countEl.textContent = statusTickets.length;
    
    if (statusTickets.length === 0) {
      column.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">No tickets</div>';
      return;
    }
    
    column.innerHTML = statusTickets.map(ticket => createTicketCard(ticket)).join('');
    
    // Add drag listeners
    column.querySelectorAll('.kanban-ticket').forEach(card => {
      card.draggable = true;
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
    });
  });
  
  // Add drop listeners
  document.querySelectorAll('.column-body').forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragenter', handleDragEnter);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

// ═══════════════════════════════════════════════════════════════════
// CREATE TICKET CARD
// ═══════════════════════════════════════════════════════════════════

function createTicketCard(ticket) {
  const priorityClass = ticket.priority || 'normal';
  const statusLabel = getStatusLabel(ticket.status);
  
  return `
    <div class="kanban-ticket priority-${priorityClass}" data-ticket-id="${ticket.id}" draggable="true">
      <div class="kanban-ticket-header">
        <div class="kanban-ticket-id">${ticket.ticket_number || ticket.id.slice(0, 8)}</div>
        <div class="kanban-ticket-time">${formatDate(ticket.created_at)}</div>
      </div>
      <div class="kanban-ticket-customer">${ticket.customer_name || 'Walk-in'}</div>
      <div class="kanban-ticket-device">${ticket.device_type || 'Unknown Device'}</div>
      <div class="kanban-ticket-footer">
        <div class="kanban-ticket-issue">${(ticket.device_issue || '').substring(0, 30)}${ticket.device_issue?.length > 30 ? '...' : ''}</div>
        <div class="kanban-ticket-price">${formatCurrency(ticket.quoted_price || 0)}</div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// DRAG AND DROP HANDLERS
// ═══════════════════════════════════════════════════════════════════

function handleDragStart(e) {
  draggedTicket = e.target.closest('.kanban-ticket');
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.style.opacity = '1';
  document.querySelectorAll('.column-body').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  if (!draggedTicket) return;
  
  const ticketId = draggedTicket.dataset.ticketId;
  const newStatus = e.currentTarget.closest('.column').classList[1].replace('stage-', '');
  
  try {
    await apiCall(`/api/tickets?id=${ticketId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    
    // Update local state
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = newStatus;
    }
    
    showToast('Ticket status updated', 'success');
    renderKanbanBoard();
  } catch (error) {
    console.error('Error updating ticket:', error);
    renderKanbanBoard(); // Revert UI
  }
  
  draggedTicket = null;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

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
  loadTickets();
});

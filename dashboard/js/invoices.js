/**
 * Invoices Page JavaScript
 */

const { apiCall, showToast, formatCurrency, formatDate } = window.FixologyApp;

let invoices = [];

// ═══════════════════════════════════════════════════════════════════
// LOAD INVOICES
// ═══════════════════════════════════════════════════════════════════

async function loadInvoices() {
  try {
    const data = await apiCall('/api/invoices?limit=1000');
    invoices = data.invoices || [];
    renderInvoices();
  } catch (error) {
    console.error('Error loading invoices:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER INVOICES
// ═══════════════════════════════════════════════════════════════════

function renderInvoices() {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;
  
  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:60px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:16px">📄</div>
          <div style="font-size:18px;font-weight:600;margin-bottom:8px">No invoices yet</div>
          <div style="font-size:14px">Create your first invoice to get started</div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = invoices.map(invoice => createInvoiceRow(invoice)).join('');
}

// ═══════════════════════════════════════════════════════════════════
// CREATE INVOICE ROW
// ═══════════════════════════════════════════════════════════════════

function createInvoiceRow(invoice) {
  const statusClass = getStatusClass(invoice.status);
  const isOverdue = invoice.status === 'pending' && invoice.due_date && new Date(invoice.due_date) < new Date();
  const finalStatus = isOverdue ? 'overdue' : invoice.status;
  
  return `
    <tr onclick="viewInvoice('${invoice.id}')" style="cursor:pointer">
      <td><span class="invoice-id">${invoice.invoice_number}</span></td>
      <td>${invoice.customer_name || 'N/A'}</td>
      <td>${invoice.line_items?.[0]?.description || 'N/A'}</td>
      <td>${formatDate(invoice.created_at)}</td>
      <td>${invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</td>
      <td class="amount">${formatCurrency(invoice.total || 0)}</td>
      <td><span class="status ${finalStatus}">${getStatusLabel(finalStatus)}</span></td>
      <td>
        <button class="actions-btn" onclick="event.stopPropagation();viewInvoice('${invoice.id}')">View</button>
        ${invoice.status === 'pending' ? `<button class="actions-btn" onclick="event.stopPropagation();markPaid('${invoice.id}')">Mark Paid</button>` : ''}
      </td>
    </tr>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// INVOICE ACTIONS
// ═══════════════════════════════════════════════════════════════════

async function markPaid(invoiceId) {
  try {
    await apiCall(`/api/invoices?id=${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid' })
    });
    
    showToast('Invoice marked as paid', 'success');
    loadInvoices();
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
  }
}

function viewInvoice(id) {
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return;
  
  // TODO: Open invoice detail modal
  console.log('View invoice:', invoice);
}

function openNewInvoiceModal() {
  const modal = document.getElementById('invoice-modal');
  if (modal) {
    document.getElementById('modal-title').textContent = 'Create Invoice';
    document.getElementById('invoice-id').value = '';
    document.getElementById('invoice-form').reset();
    window.FixologyApp.openModal('invoice-modal');
  }
}

async function saveInvoice(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const id = formData.get('invoice_id');
  
  // Get line items
  const lineItems = [];
  const itemRows = form.querySelectorAll('.line-item-row');
  itemRows.forEach(row => {
    const description = row.querySelector('.item-description').value;
    const quantity = row.querySelector('.item-quantity').value;
    const price = row.querySelector('.item-price').value;
    if (description && quantity && price) {
      lineItems.push({ description, quantity: parseInt(quantity), price: parseFloat(price) });
    }
  });
  
  const invoiceData = {
    customer_id: formData.get('customer_id'),
    customer_name: formData.get('customer_name'),
    customer_email: formData.get('customer_email'),
    line_items: lineItems,
    tax_rate: formData.get('tax_rate') || 0,
    notes: formData.get('notes'),
    due_date: formData.get('due_date')
  };
  
  try {
    if (id) {
      await apiCall(`/api/invoices?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData)
      });
      showToast('Invoice updated successfully', 'success');
    } else {
      await apiCall('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });
      showToast('Invoice created successfully', 'success');
    }
    
    window.FixologyApp.closeModal('invoice-modal');
    loadInvoices();
  } catch (error) {
    console.error('Error saving invoice:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getStatusClass(status) {
  const map = {
    'paid': 'status-paid',
    'pending': 'status-pending',
    'overdue': 'status-overdue',
    'draft': 'status-draft',
    'cancelled': 'status-cancelled'
  };
  return map[status] || 'status-draft';
}

function getStatusLabel(status) {
  const map = {
    'paid': 'Paid',
    'pending': 'Pending',
    'overdue': 'Overdue',
    'draft': 'Draft',
    'cancelled': 'Cancelled'
  };
  return map[status] || status;
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadInvoices();
  
  const form = document.getElementById('invoice-form');
  if (form) {
    form.addEventListener('submit', saveInvoice);
  }
});

// Export for global access
window.openNewInvoiceModal = openNewInvoiceModal;
window.viewInvoice = viewInvoice;
window.markPaid = markPaid;

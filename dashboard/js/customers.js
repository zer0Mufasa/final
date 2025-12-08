/**
 * Customers Page JavaScript
 */

const { apiCall, showToast, formatCurrency, formatPhone, debounce } = window.FixologyApp;

let customers = [];
let filteredCustomers = [];

// ═══════════════════════════════════════════════════════════════════
// LOAD CUSTOMERS
// ═══════════════════════════════════════════════════════════════════

async function loadCustomers() {
  try {
    const data = await apiCall('/api/customers?limit=1000');
    customers = data.customers || [];
    filteredCustomers = [...customers];
    renderCustomers();
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER CUSTOMERS
// ═══════════════════════════════════════════════════════════════════

function renderCustomers() {
  const grid = document.getElementById('customers-grid');
  if (!grid) return;
  
  if (filteredCustomers.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:16px">👥</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px">No customers found</div>
        <div style="font-size:14px">Add your first customer to get started</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredCustomers.map(customer => createCustomerCard(customer)).join('');
}

// ═══════════════════════════════════════════════════════════════════
// CREATE CUSTOMER CARD
// ═══════════════════════════════════════════════════════════════════

function createCustomerCard(customer) {
  const initials = `${(customer.first_name || '')[0] || ''}${(customer.last_name || '')[0] || ''}`.toUpperCase() || '?';
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
  const statusClass = customer.status === 'vip' ? 'vip' : customer.status === 'inactive' ? 'inactive' : '';
  
  return `
    <div class="customer-card" onclick="viewCustomer('${customer.id}')">
      <div class="customer-header">
        <div class="customer-avatar">${initials}</div>
        <div>
          <div class="customer-name">${fullName}</div>
          <div class="customer-email">${customer.email || 'No email'}</div>
        </div>
      </div>
      <div class="customer-details">
        <div class="row">
          <span class="label">Phone</span>
          <span>${formatPhone(customer.phone) || 'N/A'}</span>
        </div>
      </div>
      <div class="customer-stats">
        <div class="customer-stat">
          <div class="customer-stat-value">${customer.total_repairs || 0}</div>
          <div class="customer-stat-label">Repairs</div>
        </div>
        <div class="customer-stat">
          <div class="customer-stat-value">${formatCurrency(customer.total_spent || 0)}</div>
          <div class="customer-stat-label">Spent</div>
        </div>
      </div>
      ${customer.status ? `<div style="margin-top:12px"><span class="tag ${statusClass}">${customer.status.toUpperCase()}</span></div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH AND FILTER
// ═══════════════════════════════════════════════════════════════════

function setupSearch() {
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      filterCustomers(e.target.value);
    }, 300));
  }
}

function filterCustomers(query) {
  if (!query) {
    filteredCustomers = [...customers];
  } else {
    const queryLower = query.toLowerCase();
    filteredCustomers = customers.filter(c => 
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(queryLower) ||
      c.email?.toLowerCase().includes(queryLower) ||
      c.phone?.includes(query)
    );
  }
  renderCustomers();
}

function filterByStatus(status) {
  if (status === 'all') {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(c => c.status === status);
  }
  renderCustomers();
}

window.filterByStatus = filterByStatus;

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER MODAL
// ═══════════════════════════════════════════════════════════════════

function openAddModal() {
  const modal = document.getElementById('customer-modal');
  if (modal) {
    document.getElementById('modal-title').textContent = 'Add Customer';
    document.getElementById('customer-id').value = '';
    document.getElementById('customer-form').reset();
    window.FixologyApp.openModal('customer-modal');
  }
}

function openEditModal(customer) {
  const modal = document.getElementById('customer-modal');
  if (modal) {
    document.getElementById('modal-title').textContent = 'Edit Customer';
    document.getElementById('customer-id').value = customer.id;
    document.getElementById('customer-first-name').value = customer.first_name || '';
    document.getElementById('customer-last-name').value = customer.last_name || '';
    document.getElementById('customer-phone').value = customer.phone || '';
    document.getElementById('customer-email').value = customer.email || '';
    document.getElementById('customer-address').value = customer.address || '';
    document.getElementById('customer-notes').value = customer.notes || '';
    window.FixologyApp.openModal('customer-modal');
  }
}

async function saveCustomer(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const id = formData.get('customer_id');
  
  const customerData = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    notes: formData.get('notes')
  };
  
  try {
    if (id) {
      await apiCall(`/api/customers?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });
      showToast('Customer updated successfully', 'success');
    } else {
      await apiCall('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      showToast('Customer added successfully', 'success');
    }
    
    window.FixologyApp.closeModal('customer-modal');
    loadCustomers();
  } catch (error) {
    console.error('Error saving customer:', error);
  }
}

function viewCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  
  // TODO: Open customer detail modal
  openEditModal(customer);
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  setupSearch();
  
  const form = document.getElementById('customer-form');
  if (form) {
    form.addEventListener('submit', saveCustomer);
  }
});

// Export for global access
window.openAddCustomerModal = openAddModal;
window.viewCustomer = viewCustomer;

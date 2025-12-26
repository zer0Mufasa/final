/**
 * Inventory Page JavaScript
 */

const { apiCall, showToast, formatCurrency } = window.FixologyApp;

let inventory = [];

// ═══════════════════════════════════════════════════════════════════
// LOAD INVENTORY
// ═══════════════════════════════════════════════════════════════════

async function loadInventory() {
  try {
    const data = await apiCall('/api/inventory?limit=1000');
    inventory = data.inventory || [];
    renderInventory();
    checkLowStock();
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDER INVENTORY
// ═══════════════════════════════════════════════════════════════════

function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;
  
  if (inventory.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
        <div style="font-size:48px;margin-bottom:16px">📦</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px">No inventory items</div>
        <div style="font-size:14px">Add your first part to get started</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = inventory.map(item => createInventoryCard(item)).join('');
}

// ═══════════════════════════════════════════════════════════════════
// CREATE INVENTORY CARD
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// STOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

async function adjustStock(itemId, adjustment) {
  try {
    await apiCall(`/api/inventory?id=${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ adjustment })
    });
    
    showToast('Stock updated', 'success');
    loadInventory();
  } catch (error) {
    console.error('Error adjusting stock:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK LOW STOCK
// ═══════════════════════════════════════════════════════════════════

async function checkLowStock() {
  try {
    const data = await apiCall('/api/inventory?lowStock=true');
    const lowStockItems = data.items || [];
    
    if (lowStockItems.length > 0) {
      const banner = document.getElementById('low-stock-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.innerHTML = `
          <div class="alert">
            <span class="alert-icon">⚠️</span>
            <div class="alert-text">
              <strong>${lowStockItems.length} item(s) running low on stock</strong>
              <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">
                ${lowStockItems.slice(0, 3).map(i => i.name).join(', ')}${lowStockItems.length > 3 ? '...' : ''}
              </div>
            </div>
            <span class="alert-action" onclick="filterLowStock()" style="cursor:pointer">View All →</span>
          </div>
        `;
      }
    } else {
      const banner = document.getElementById('low-stock-banner');
      if (banner) banner.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
}

function filterLowStock() {
  // Reload all inventory and filter
  loadInventory().then(() => {
    inventory = inventory.filter(i => i.current_stock <= i.min_stock);
    renderInventory();
  });
}

// ═══════════════════════════════════════════════════════════════════
// ADD/EDIT ITEM
// ═══════════════════════════════════════════════════════════════════

function openAddModal() {
  const modal = document.getElementById('inventory-modal');
  if (modal) {
    document.getElementById('modal-title').textContent = 'Add Inventory Item';
    document.getElementById('item-id').value = '';
    document.getElementById('inventory-form').reset();
    window.FixologyApp.openModal('inventory-modal');
  }
}

function editItem(itemId) {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.getElementById('inventory-modal');
  if (modal) {
    document.getElementById('modal-title').textContent = 'Edit Inventory Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-sku').value = item.sku || '';
    document.getElementById('item-category').value = item.category || '';
    document.getElementById('item-cost').value = item.cost_price || '';
    document.getElementById('item-sell').value = item.sell_price || '';
    document.getElementById('item-stock').value = item.current_stock || 0;
    document.getElementById('item-min-stock').value = item.min_stock || 5;
    document.getElementById('item-supplier').value = item.supplier || '';
    window.FixologyApp.openModal('inventory-modal');
  }
}

async function saveItem(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const id = formData.get('item_id');
  
  const itemData = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    category: formData.get('category'),
    cost_price: formData.get('cost_price'),
    sell_price: formData.get('sell_price'),
    current_stock: formData.get('current_stock'),
    min_stock: formData.get('min_stock'),
    supplier: formData.get('supplier')
  };
  
  try {
    if (id) {
      await apiCall(`/api/inventory?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      });
      showToast('Item updated successfully', 'success');
    } else {
      await apiCall('/api/inventory', {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
      showToast('Item added successfully', 'success');
    }
    
    window.FixologyApp.closeModal('inventory-modal');
    loadInventory();
  } catch (error) {
    console.error('Error saving item:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadInventory();
  
  const form = document.getElementById('inventory-form');
  if (form) {
    form.addEventListener('submit', saveItem);
  }
});

// Export for global access
window.openAddInventoryModal = openAddModal;
window.editItem = editItem;
window.adjustStock = adjustStock;
window.filterLowStock = filterLowStock;

/* ============================================
   FIXOLOGY POS - DATA STORAGE LAYER
   ============================================ */

const POS_DATA = {
  // ============================================
  // TICKETS
  // ============================================
  
  getTickets: () => {
    return JSON.parse(localStorage.getItem('fixology_tickets') || '[]');
  },

  getTicket: (id) => {
    const tickets = POS_DATA.getTickets();
    return tickets.find(t => t.id === id);
  },

  saveTicket: (ticket) => {
    const tickets = POS_DATA.getTickets();
    const index = tickets.findIndex(t => t.id === ticket.id);
    
    if (index >= 0) {
      tickets[index] = { ...ticket, updatedAt: new Date().toISOString() };
    } else {
      ticket.id = POS_DATA.generateTicketId();
      ticket.createdAt = new Date().toISOString();
      ticket.updatedAt = new Date().toISOString();
      tickets.unshift(ticket);
    }
    
    localStorage.setItem('fixology_tickets', JSON.stringify(tickets));
    return ticket;
  },

  deleteTicket: (id) => {
    let tickets = POS_DATA.getTickets();
    tickets = tickets.filter(t => t.id !== id);
    localStorage.setItem('fixology_tickets', JSON.stringify(tickets));
  },

  generateTicketId: () => {
    const year = new Date().getFullYear();
    const tickets = POS_DATA.getTickets();
    const num = String(tickets.length + 1).padStart(6, '0');
    return `FIX-${year}-${num}`;
  },

  updateTicketStatus: (id, status) => {
    const ticket = POS_DATA.getTicket(id);
    if (ticket) {
      ticket.status = status;
      POS_DATA.addActivity(id, `Status changed to ${status}`);
      POS_DATA.saveTicket(ticket);
      return ticket;
    }
    return null;
  },

  addActivity: (ticketId, action, author = 'System') => {
    const ticket = POS_DATA.getTicket(ticketId);
    if (ticket) {
      if (!ticket.repair) ticket.repair = {};
      if (!ticket.repair.notes) ticket.repair.notes = [];
      
      ticket.repair.notes.unshift({
        timestamp: new Date().toISOString(),
        author: author,
        text: action
      });
      
      // Don't call saveTicket here to avoid infinite loop
      const tickets = POS_DATA.getTickets();
      const index = tickets.findIndex(t => t.id === ticketId);
      if (index >= 0) {
        tickets[index] = { ...ticket, updatedAt: new Date().toISOString() };
        localStorage.setItem('fixology_tickets', JSON.stringify(tickets));
      }
    }
  },

  // Get tickets by status
  getTicketsByStatus: (status) => {
    return POS_DATA.getTickets().filter(t => t.status === status);
  },

  // Search tickets
  searchTickets: (query) => {
    const q = query.toLowerCase();
    return POS_DATA.getTickets().filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.customer?.name?.toLowerCase().includes(q) ||
      t.customer?.phone?.includes(q) ||
      t.device?.model?.toLowerCase().includes(q) ||
      t.device?.brand?.toLowerCase().includes(q)
    );
  },

  // ============================================
  // CUSTOMERS
  // ============================================
  
  getCustomers: () => {
    return JSON.parse(localStorage.getItem('fixology_customers') || '[]');
  },

  getCustomer: (id) => {
    return POS_DATA.getCustomers().find(c => c.id === id);
  },

  saveCustomer: (customer) => {
    const customers = POS_DATA.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    
    if (index >= 0) {
      customers[index] = { ...customer, updatedAt: new Date().toISOString() };
    } else {
      customer.id = 'CUST-' + Date.now();
      customer.createdAt = new Date().toISOString();
      customer.updatedAt = new Date().toISOString();
      customers.unshift(customer);
    }
    
    localStorage.setItem('fixology_customers', JSON.stringify(customers));
    return customer;
  },

  deleteCustomer: (id) => {
    let customers = POS_DATA.getCustomers();
    customers = customers.filter(c => c.id !== id);
    localStorage.setItem('fixology_customers', JSON.stringify(customers));
  },

  searchCustomers: (query) => {
    const q = query.toLowerCase();
    return POS_DATA.getCustomers().filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  },

  getCustomerTickets: (customerId) => {
    return POS_DATA.getTickets().filter(t => t.customer?.id === customerId);
  },

  // ============================================
  // INVENTORY
  // ============================================
  
  getInventory: () => {
    return JSON.parse(localStorage.getItem('fixology_inventory') || '[]');
  },

  getPart: (id) => {
    return POS_DATA.getInventory().find(p => p.id === id);
  },

  savePart: (part) => {
    const inventory = POS_DATA.getInventory();
    const index = inventory.findIndex(p => p.id === part.id);
    
    if (index >= 0) {
      inventory[index] = { ...part, updatedAt: new Date().toISOString() };
    } else {
      part.id = 'PART-' + Date.now();
      part.createdAt = new Date().toISOString();
      part.updatedAt = new Date().toISOString();
      inventory.unshift(part);
    }
    
    localStorage.setItem('fixology_inventory', JSON.stringify(inventory));
    return part;
  },

  deletePart: (id) => {
    let inventory = POS_DATA.getInventory();
    inventory = inventory.filter(p => p.id !== id);
    localStorage.setItem('fixology_inventory', JSON.stringify(inventory));
  },

  adjustStock: (id, quantity) => {
    const part = POS_DATA.getPart(id);
    if (part) {
      part.stock = Math.max(0, (part.stock || 0) + quantity);
      POS_DATA.savePart(part);
      return part;
    }
    return null;
  },

  searchInventory: (query) => {
    const q = query.toLowerCase();
    return POS_DATA.getInventory().filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  },

  getLowStockParts: (threshold = 5) => {
    return POS_DATA.getInventory().filter(p => (p.stock || 0) <= threshold);
  },

  // ============================================
  // SETTINGS
  // ============================================
  
  getSettings: () => {
    return JSON.parse(localStorage.getItem('fixology_pos_settings') || '{}');
  },

  saveSetting: (key, value) => {
    const settings = POS_DATA.getSettings();
    settings[key] = value;
    localStorage.setItem('fixology_pos_settings', JSON.stringify(settings));
  },

  getSetting: (key, defaultValue = null) => {
    const settings = POS_DATA.getSettings();
    return settings[key] ?? defaultValue;
  },

  // ============================================
  // STATS
  // ============================================
  
  getStats: () => {
    const tickets = POS_DATA.getTickets();
    const today = new Date().toDateString();
    
    const todayTickets = tickets.filter(t => 
      new Date(t.createdAt).toDateString() === today
    );
    
    const todayRevenue = todayTickets
      .filter(t => t.status === 'picked_up')
      .reduce((sum, t) => sum + (t.pricing?.total || 0), 0);
    
    const statusCounts = {
      new: tickets.filter(t => t.status === 'new').length,
      diagnosed: tickets.filter(t => t.status === 'diagnosed').length,
      waiting_parts: tickets.filter(t => t.status === 'waiting_parts').length,
      in_repair: tickets.filter(t => t.status === 'in_repair').length,
      ready: tickets.filter(t => t.status === 'ready').length,
      picked_up: tickets.filter(t => t.status === 'picked_up').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length
    };
    
    return {
      totalTickets: tickets.length,
      activeTickets: tickets.filter(t => !['picked_up', 'cancelled'].includes(t.status)).length,
      todayTickets: todayTickets.length,
      todayRevenue: todayRevenue,
      statusCounts: statusCounts,
      totalCustomers: POS_DATA.getCustomers().length,
      lowStockCount: POS_DATA.getLowStockParts().length
    };
  },

  // ============================================
  // SEED DATA (for testing)
  // ============================================
  
  seedDemoData: () => {
    // Only seed if no data exists
    if (POS_DATA.getTickets().length > 0) return;
    
    // Demo customers
    const customers = [
      { id: 'CUST-001', name: 'John Smith', phone: '314-555-1234', email: 'john@email.com', address: '123 Main St, St. Louis, MO 63033' },
      { id: 'CUST-002', name: 'Mary Johnson', phone: '314-555-5678', email: 'mary@email.com', address: '456 Oak Ave, St. Louis, MO 63033' },
      { id: 'CUST-003', name: 'Robert Williams', phone: '636-555-9999', email: 'robert@email.com', address: '789 Pine Rd, Ballwin, MO 63011' },
      { id: 'CUST-004', name: 'Sarah Davis', phone: '314-555-4321', email: 'sarah@email.com', address: '321 Elm St, St. Louis, MO 63033' },
      { id: 'CUST-005', name: 'Michael Brown', phone: '573-555-8765', email: 'michael@email.com', address: '654 Maple Dr, Columbia, MO 65201' }
    ];
    localStorage.setItem('fixology_customers', JSON.stringify(customers));
    
    // Demo inventory
    const inventory = [
      { id: 'PART-001', name: 'iPhone 14 Pro Max Screen Assembly', sku: 'IP14PM-SCR', category: 'Screens', cost: 85, price: 149, stock: 5, grade: 'A' },
      { id: 'PART-002', name: 'iPhone 13 Screen Assembly', sku: 'IP13-SCR', category: 'Screens', cost: 55, price: 99, stock: 8, grade: 'A' },
      { id: 'PART-003', name: 'Samsung S23 Ultra Screen', sku: 'SS23U-SCR', category: 'Screens', cost: 120, price: 199, stock: 3, grade: 'A' },
      { id: 'PART-004', name: 'iPhone 12 Battery', sku: 'IP12-BAT', category: 'Batteries', cost: 15, price: 49, stock: 12, grade: 'A' },
      { id: 'PART-005', name: 'iPhone 14 Battery', sku: 'IP14-BAT', category: 'Batteries', cost: 25, price: 69, stock: 7, grade: 'A' },
      { id: 'PART-006', name: 'iPad Pro 12.9 Screen', sku: 'IPADP12-SCR', category: 'Screens', cost: 180, price: 299, stock: 2, grade: 'A' },
      { id: 'PART-007', name: 'PS5 HDMI Port', sku: 'PS5-HDMI', category: 'Console Parts', cost: 25, price: 75, stock: 4, grade: 'A' },
      { id: 'PART-008', name: 'iPhone Charging Port', sku: 'IP-CHG', category: 'Charging', cost: 8, price: 39, stock: 15, grade: 'A' }
    ];
    localStorage.setItem('fixology_inventory', JSON.stringify(inventory));
    
    // Demo tickets
    const now = new Date();
    const tickets = [
      {
        id: 'FIX-2024-000001',
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
        status: 'new',
        priority: 'high',
        customer: customers[0],
        device: { type: 'smartphone', brand: 'Apple', model: 'iPhone 15 Pro Max', color: 'Natural Titanium', imei: '356558088449233' },
        issue: { customerDescription: 'Dropped phone, screen cracked and touch not working', symptoms: ['cracked_screen', 'no_touch'] },
        repair: { type: 'screen_replacement', notes: [] },
        parts: [],
        pricing: { laborCost: 50, partsCost: 149, tax: 15.92, total: 214.92, deposit: 50 }
      },
      {
        id: 'FIX-2024-000002',
        createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
        status: 'diagnosed',
        priority: 'normal',
        customer: customers[1],
        device: { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23 Ultra', color: 'Phantom Black', imei: '351234567890123' },
        issue: { customerDescription: 'Battery drains very fast', symptoms: ['battery_drain'] },
        repair: { type: 'battery_replacement', notes: [{ timestamp: new Date().toISOString(), author: 'Tech Mike', text: 'Battery health at 67%, needs replacement' }] },
        parts: [],
        pricing: { laborCost: 30, partsCost: 69, tax: 7.92, total: 106.92, deposit: 0 }
      },
      {
        id: 'FIX-2024-000003',
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: 'waiting_parts',
        priority: 'normal',
        customer: customers[2],
        device: { type: 'tablet', brand: 'Apple', model: 'iPad Pro 12.9 (2022)', color: 'Space Gray', serial: 'DMPVH0Q8HG7L' },
        issue: { customerDescription: 'Screen has dead pixels and crack', symptoms: ['cracked_screen', 'display_issue'] },
        repair: { type: 'screen_replacement', notes: [] },
        parts: [],
        pricing: { laborCost: 60, partsCost: 299, tax: 28.72, total: 387.72, deposit: 100 }
      },
      {
        id: 'FIX-2024-000004',
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 45 * 60 * 1000).toISOString(),
        status: 'in_repair',
        priority: 'urgent',
        customer: customers[3],
        device: { type: 'smartphone', brand: 'Apple', model: 'iPhone 14', color: 'Blue', imei: '352345678901234' },
        issue: { customerDescription: 'Phone wont charge', symptoms: ['no_charge'] },
        repair: { type: 'charging_port', assignedTo: 'Tech Mike', startedAt: new Date(now - 45 * 60 * 1000).toISOString(), notes: [] },
        parts: [],
        pricing: { laborCost: 40, partsCost: 39, tax: 6.32, total: 85.32, deposit: 0 }
      },
      {
        id: 'FIX-2024-000005',
        createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 30 * 60 * 1000).toISOString(),
        status: 'ready',
        priority: 'normal',
        customer: customers[4],
        device: { type: 'console', brand: 'Sony', model: 'PlayStation 5', color: 'White', serial: 'PS5123456789' },
        issue: { customerDescription: 'No video output', symptoms: ['no_display'] },
        repair: { type: 'hdmi_repair', completedAt: new Date(now - 30 * 60 * 1000).toISOString(), notes: [] },
        parts: [{ id: 'PART-007', name: 'PS5 HDMI Port', price: 75, quantity: 1 }],
        pricing: { laborCost: 60, partsCost: 75, tax: 10.80, total: 145.80, deposit: 50 }
      }
    ];
    localStorage.setItem('fixology_tickets', JSON.stringify(tickets));
    
    console.log('Demo data seeded successfully!');
  }
};

// Initialize demo data on load
document.addEventListener('DOMContentLoaded', () => {
  POS_DATA.seedDemoData();
});


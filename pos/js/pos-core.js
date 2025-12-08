/* ============================================
   FIXOLOGY POS - CORE FUNCTIONS
   ============================================ */

const POS = {
  // ============================================
  // TIME UTILITIES
  // ============================================
  
  timeAgo: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    
    return date.toLocaleDateString();
  },

  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatTime: (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  formatDateTime: (dateString) => {
    return `${POS.formatDate(dateString)} ${POS.formatTime(dateString)}`;
  },

  formatCurrency: (amount) => {
    return '$' + (amount || 0).toFixed(2);
  },

  formatPhone: (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phone;
  },

  // ============================================
  // STATUS HELPERS
  // ============================================
  
  statusLabels: {
    new: 'New',
    diagnosed: 'Diagnosed',
    waiting_parts: 'Waiting Parts',
    in_repair: 'In Repair',
    ready: 'Ready',
    picked_up: 'Picked Up',
    cancelled: 'Cancelled'
  },

  statusIcons: {
    new: '📥',
    diagnosed: '🔍',
    waiting_parts: '📦',
    in_repair: '🔧',
    ready: '✅',
    picked_up: '💰',
    cancelled: '❌'
  },

  getStatusLabel: (status) => {
    return POS.statusLabels[status] || status;
  },

  getStatusIcon: (status) => {
    return POS.statusIcons[status] || '📋';
  },

  getStatusClass: (status) => {
    const map = {
      new: 'new',
      diagnosed: 'diagnosed',
      waiting_parts: 'waiting',
      in_repair: 'repair',
      ready: 'ready',
      picked_up: 'picked',
      cancelled: 'cancelled'
    };
    return map[status] || 'new';
  },

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  
  showToast: (message, type = 'info', duration = 3000) => {
    // Create container if doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.style.cssText = 'position: fixed; top: 24px; right: 24px; z-index: 2000; display: flex; flex-direction: column; gap: 12px;';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    // Type-specific colors
    const colors = {
      success: { bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, #12121a 100%)', border: '#10b981' },
      error: { bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, #12121a 100%)', border: '#ef4444' },
      warning: { bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, #12121a 100%)', border: '#f59e0b' },
      info: { bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, #12121a 100%)', border: '#3b82f6' }
    };
    const color = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: ${color.bg};
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 4px solid ${color.border};
      border-radius: 14px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      min-width: 300px;
      max-width: 450px;
      animation: toastIn 0.3s ease;
      backdrop-filter: blur(10px);
      color: #fff;
    `;
    toast.innerHTML = `
      <span style="font-size: 20px;">${icons[type]}</span>
      <span style="flex: 1; font-size: 14px; color: #fff;">${message}</span>
      <button style="background: rgba(255,255,255,0.1); border: none; color: #a1a1aa; cursor: pointer; padding: 6px 10px; border-radius: 6px; font-size: 16px;" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Auto remove
    if (type !== 'error') {
      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  },

  success: (message) => POS.showToast(message, 'success'),
  error: (message) => POS.showToast(message, 'error', 0),
  warning: (message) => POS.showToast(message, 'warning', 5000),
  info: (message) => POS.showToast(message, 'info'),

  // ============================================
  // CONFIRMATION DIALOGS
  // ============================================
  
  confirm: (title, message, onConfirm, onCancel) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger" id="confirm-ok">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').onclick = () => {
      overlay.remove();
      if (onCancel) onCancel();
    };

    overlay.querySelector('#confirm-ok').onclick = () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    };
  },

  // ============================================
  // MODAL HELPERS
  // ============================================
  
  openModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  closeAllModals: () => {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
      modal.classList.remove('open');
    });
    document.body.style.overflow = '';
  },

  // ============================================
  // DROPDOWN HELPERS
  // ============================================
  
  initDropdowns: () => {
    document.addEventListener('click', (e) => {
      // Close all dropdowns when clicking outside
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = toggle.closest('.dropdown');
        const wasOpen = dropdown.classList.contains('open');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        
        // Toggle this one
        if (!wasOpen) {
          dropdown.classList.add('open');
        }
      });
    });
  },

  // ============================================
  // SEARCH HELPERS
  // ============================================
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // ============================================
  // URL HELPERS
  // ============================================
  
  getUrlParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  setUrlParam: (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  // ============================================
  // NAVIGATION
  // ============================================
  
  navigate: (url) => {
    window.location.href = url;
  },

  // ============================================
  // ESCAPE HTML
  // ============================================
  
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ============================================
  // DEVICE ICONS
  // ============================================
  
  deviceIcons: {
    smartphone: '📱',
    tablet: '📱',
    laptop: '💻',
    desktop: '🖥️',
    console: '🎮',
    other: '📟'
  },

  getDeviceIcon: (type) => {
    return POS.deviceIcons[type] || '📟';
  },

  // ============================================
  // PRINTING (opens print window)
  // ============================================
  
  print: (html, title = 'Fixology') => {
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #5D3FD3; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #5D3FD3; margin: 0; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; margin-bottom: 5px; }
          .label { width: 150px; font-weight: bold; }
          .value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .total-row { font-weight: bold; background: #f0f0f0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${html}
        <div class="footer">
          <p>Thank you for choosing Fixology!</p>
          <p>Questions? Call us at (314) 555-0100</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  },

  // ============================================
  // KANBAN DRAG SCROLL
  // ============================================
  
  initKanbanScroll: () => {
    const board = document.querySelector('.kanban-board');
    if (!board) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    board.addEventListener('mousedown', (e) => {
      // Only activate with right mouse button or middle button
      if (e.button === 2 || e.button === 1) {
        isDown = true;
        board.classList.add('grabbing');
        startX = e.pageX - board.offsetLeft;
        scrollLeft = board.scrollLeft;
        e.preventDefault();
      }
    });

    board.addEventListener('mouseleave', () => {
      isDown = false;
      board.classList.remove('grabbing');
    });

    board.addEventListener('mouseup', () => {
      isDown = false;
      board.classList.remove('grabbing');
    });

    board.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - board.offsetLeft;
      const walk = (x - startX) * 2;
      board.scrollLeft = scrollLeft - walk;
    });

    // Prevent context menu on right click
    board.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  POS.initDropdowns();
  POS.initKanbanScroll();
});

// Close modals on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    POS.closeAllModals();
  }
});


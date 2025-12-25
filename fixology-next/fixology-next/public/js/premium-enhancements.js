/* ============================================
   FIXOLOGY PREMIUM ENHANCEMENTS
   Number Counter Animations, Chart Gradients, etc.
   ============================================ */

// Number Counter Animation
function animateCounter(element, target, duration = 1000) {
  if (!element) return;
  
  let start = 0;
  const isCurrency = element.textContent.includes('$');
  const isPercent = element.textContent.includes('%');
  const increment = target / (duration / 16);
  
  function update() {
    start += increment;
    if (start < target) {
      if (isCurrency) {
        element.textContent = '$' + Math.floor(start).toLocaleString();
      } else if (isPercent) {
        element.textContent = Math.floor(start) + '%';
      } else {
        element.textContent = Math.floor(start).toLocaleString();
      }
      requestAnimationFrame(update);
    } else {
      if (isCurrency) {
        element.textContent = '$' + target.toLocaleString();
      } else if (isPercent) {
        element.textContent = target + '%';
      } else {
        element.textContent = target.toLocaleString();
      }
    }
  }
  
  update();
}

// Initialize counters on page load
document.addEventListener('DOMContentLoaded', () => {
  // Animate all stat values
  document.querySelectorAll('.stat-value, .stat-number, [data-count]').forEach(el => {
    const count = el.dataset.count || el.textContent.replace(/[^0-9]/g, '');
    if (count) {
      const num = parseInt(count);
      if (!isNaN(num) && num > 0) {
        el.textContent = '0';
        setTimeout(() => animateCounter(el, num), 100);
      }
    }
  });
  
  // Add ripple effect to all buttons
  document.querySelectorAll('.btn, button').forEach(btn => {
    if (!btn.classList.contains('btn-ripple')) {
      btn.classList.add('btn-ripple');
    }
  });
  
  // Add icon hover animations
  document.querySelectorAll('[class*="icon"]').forEach(icon => {
    if (icon.classList.contains('icon-dashboard')) {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'pulse 0.6s ease-in-out';
      });
    } else if (icon.classList.contains('icon-ticket')) {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'slideIn 0.3s ease';
      });
    } else if (icon.classList.contains('icon-customer')) {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'wave 0.5s ease-in-out';
      });
    } else if (icon.classList.contains('icon-inventory')) {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'bounce 0.4s ease';
      });
    } else if (icon.classList.contains('icon-settings')) {
      icon.addEventListener('mouseenter', () => {
        icon.style.animation = 'rotate 0.5s ease';
      });
    }
  });
});

// Chart.js Gradient Helper
function createPurpleGradient(ctx, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
  return gradient;
}

// Confetti on ticket completion (optional)
function triggerConfetti() {
  // Simple confetti effect
  const colors = ['#8b5cf6', '#a78bfa', '#06b6d4', '#22c55e'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Add confetti animation CSS
if (!document.getElementById('confetti-styles')) {
  const style = document.createElement('style');
  style.id = 'confetti-styles';
  style.textContent = `
    @keyframes confettiFall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other scripts
window.FixologyPremium = {
  animateCounter,
  createPurpleGradient,
  triggerConfetti
};


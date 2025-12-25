/**
 * Fixology IMEI Intelligence Engine v2.0
 * Frontend for IMEI verification with Basic & Deep check support
 */

const IMEI_CONFIG = {
  apiEndpoint: 'https://final-bice-phi.vercel.app/api/imei-check',
  debugMode: true // Set to false for production
};

const IMEI_STATE = {
  isLoading: false,
  lastResult: null,
  selectedMode: 'basic' // 'basic' or 'deep'
};

// DOM elements cache
let DOM = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initImeiEngine);

function initImeiEngine() {
  DOM = {
    input: document.getElementById('imei-input'),
    counter: document.getElementById('imei-counter'),
    validationStatus: document.getElementById('validation-status'),
    checkBtn: document.getElementById('check-btn'),
    progressSection: document.getElementById('progress-section'),
    errorSection: document.getElementById('error-section'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    resultsSection: document.getElementById('results-section'),
    debugSection: document.getElementById('debug-section'),
    debugOutput: document.getElementById('debug-output'),
    modeBasic: document.getElementById('mode-basic'),
    modeDeep: document.getElementById('mode-deep')
  };
  
  if (DOM.input) {
    DOM.input.addEventListener('input', handleImeiInput);
    DOM.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !DOM.checkBtn?.disabled) {
        runImeiCheck();
      }
    });
  }
  
  if (DOM.checkBtn) {
    DOM.checkBtn.addEventListener('click', runImeiCheck);
  }
  
  // Mode selection handlers
  if (DOM.modeBasic) {
    DOM.modeBasic.addEventListener('change', () => {
      IMEI_STATE.selectedMode = 'basic';
      console.log('Mode selected: basic');
    });
  }
  
  if (DOM.modeDeep) {
    DOM.modeDeep.addEventListener('change', () => {
      IMEI_STATE.selectedMode = 'deep';
      console.log('Mode selected: deep');
    });
  }
  
  console.log('✅ Fixology IMEI Engine v2.0 initialized');
}

function handleImeiInput(e) {
  const value = e.target.value.replace(/\D/g, '').slice(0, 15);
  e.target.value = value;
  
  if (DOM.counter) {
    DOM.counter.textContent = `${value.length}/15`;
    DOM.counter.classList.toggle('complete', value.length === 15);
  }
  
  DOM.input.classList.remove('valid', 'invalid');
  
  if (value.length >= 14) {
    const isValid = validateImei(value);
    DOM.input.classList.add(isValid ? 'valid' : 'invalid');
    
    if (DOM.checkBtn) DOM.checkBtn.disabled = !isValid;
    
    if (DOM.validationStatus) {
      DOM.validationStatus.innerHTML = isValid
        ? '<span class="status-dot success"></span> Valid IMEI — Ready to check'
        : '<span class="status-dot error"></span> Invalid IMEI checksum';
      DOM.validationStatus.className = `validation-status ${isValid ? 'valid' : 'invalid'}`;
    }
  } else {
    if (DOM.checkBtn) DOM.checkBtn.disabled = true;
    if (DOM.validationStatus) {
      DOM.validationStatus.innerHTML = value.length > 0
        ? `<span class="status-dot"></span> ${15 - value.length} more digits needed`
        : '';
      DOM.validationStatus.className = 'validation-status';
    }
  }
}

function validateImei(imei) {
  if (!imei || !/^\d{14,15}$/.test(imei)) return false;
  
  // Luhn algorithm for 15-digit IMEI
  if (imei.length === 15) {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let d = parseInt(imei[i], 10);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return sum % 10 === 0;
  }
  
  return true; // 14-digit is valid (no checksum)
}

async function runImeiCheck() {
  const imei = DOM.input?.value?.replace(/\D/g, '');
  
  if (!imei || !validateImei(imei)) {
    showError('Invalid IMEI', 'Please enter a valid 15-digit IMEI number.');
    return;
  }
  
  if (IMEI_STATE.isLoading) return;
  
  // Get selected mode
  const mode = DOM.modeDeep?.checked ? 'deep' : 'basic';
  IMEI_STATE.selectedMode = mode;
  
  IMEI_STATE.isLoading = true;
  setLoadingState(true);
  hideError();
  hideResults();
  showProgress();
  
  console.log(`🔍 Checking IMEI: ${imei} (Mode: ${mode})`);
  
  try {
    updateProgressStep(1, 'active', 'Validating IMEI...');
    await delay(300);
    updateProgressStep(1, 'complete', 'Valid ✓');
    
    updateProgressStep(2, 'active', 'Connecting to verification service...');
    
    const response = await fetch(IMEI_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        imei: imei,
        mode: mode  // Send the selected mode
      })
    });
    
    updateProgressStep(2, 'complete', 'Connected ✓');
    updateProgressStep(3, 'active', 'Retrieving device data...');
    
    const data = await response.json();
    
    console.log('📦 API Response:', data);
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Check failed');
    }
    
    updateProgressStep(3, 'complete', 'Retrieved ✓');
    updateProgressStep(4, 'active', 'Analyzing results...');
    await delay(300);
    updateProgressStep(4, 'complete', 'Complete ✓');
    
    IMEI_STATE.lastResult = data;
    
    await delay(200);
    hideProgress();
    displayResults(data);
    
    if (IMEI_CONFIG.debugMode) {
      showDebug(data);
    }
    
  } catch (error) {
    console.error('❌ IMEI Check Error:', error);
    hideProgress();
    showError('Check Failed', error.message || 'Unable to complete IMEI verification.');
  } finally {
    IMEI_STATE.isLoading = false;
    setLoadingState(false);
  }
}

function displayResults(data) {
  // Handle both basic and deep check response formats
  const isBasicCheck = data.mode === 'basic' || data.limitedInfo === true;
  
  if (isBasicCheck) {
    displayBasicResults(data);
  } else {
    displayDeepResults(data);
  }
  
  if (DOM.resultsSection) {
    DOM.resultsSection.classList.add('visible');
    DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function displayBasicResults(data) {
  // Basic check response format
  const device = data.device || {};
  const quickStatus = data.quickStatus || {};
  
  // Device info
  setElementText('result-model', device.model || 'Unknown Device');
  setElementText('result-brand', device.brand || 'Unknown');
  setElementText('result-storage', 'Run Deep Check');
  setElementText('result-color', 'Run Deep Check');
  setElementText('result-serial', 'Run Deep Check');
  setElementText('result-imei', data.imei || 'N/A');
  
  // Network info - limited in basic
  setElementText('result-carrier', 'Run Deep Check');
  setElementText('result-country', 'Run Deep Check');
  setStatusBadge('result-simlock', 'Run Deep Check', {});
  
  // Security info - limited in basic
  setStatusBadge('result-blacklist', 'Run Deep Check', {});
  setStatusBadge('result-findmy', 'Run Deep Check', {});
  setStatusBadge('result-activation', 'Run Deep Check', {});
  setStatusBadge('result-mdm', 'Run Deep Check', {});
  
  // Warranty - limited in basic
  setStatusBadge('result-warranty', 'Run Deep Check', {});
  setElementText('result-warranty-expiry', 'Run Deep Check');
  
  // Analysis - simplified for basic
  setElementText('result-fraud-score', '—');
  setElementText('result-trust-score', '—');
  
  const overallBadge = document.getElementById('result-overall-status');
  if (overallBadge) {
    const statusColor = quickStatus.color === 'red' ? 'danger' : 
                        quickStatus.color === 'yellow' ? 'warning' : 'info';
    overallBadge.className = `status-badge ${statusColor}`;
    overallBadge.innerHTML = quickStatus.message || 'Basic Check Complete';
  }
  
  const flagsContainer = document.getElementById('result-flags');
  if (flagsContainer) {
    flagsContainer.innerHTML = `
      <div class="flag-item info">ℹ️ Basic check complete - Device identified</div>
      <div class="flag-item upgrade">
        ⬆️ <strong>Upgrade to Deep Check</strong> for full security analysis:
        <ul style="margin: 0.5rem 0 0 1.5rem; font-size: 0.875rem;">
          ${(data.availableInDeepCheck || []).slice(0, 5).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }
}

function displayDeepResults(data) {
  // Deep check response format
  const device = data.device || {};
  const identifiers = data.identifiers || {};
  const security = data.security || {};
  const warranty = data.warranty || {};
  const purchase = data.purchase || {};
  const history = data.history || {};
  const analysis = data.analysis || {};
  
  console.log('Displaying deep results:', { device, identifiers, security, warranty, purchase, history, analysis });
  
  // Device Header info
  setElementText('result-model', device.model || 'Unknown Device');
  setElementText('result-brand', device.brand || 'Unknown');
  setElementText('result-storage', device.storage || 'N/A');
  setElementText('result-color', device.color || 'N/A');
  
  // Device card details
  setElementText('result-imei', identifiers.imei || data.imei || 'N/A');
  setElementText('result-serial', identifiers.serial || 'N/A');
  setElementText('result-model-number', device.modelNumber || 'N/A');
  setElementText('result-storage-detail', device.storage || 'N/A');
  setElementText('result-color-detail', device.color || 'N/A');
  
  // Set device image if available
  const deviceIcon = document.getElementById('result-device-icon');
  if (deviceIcon && device.image) {
    deviceIcon.innerHTML = `<img src="${device.image}" alt="${device.model}" style="width:60px;height:60px;object-fit:contain;border-radius:8px;">`;
  }
  
  // Network info
  setElementText('result-carrier', security.carrier || 'Unknown');
  setElementText('result-country', purchase.country || 'N/A');
  setStatusBadge('result-simlock', security.carrierLock, {
    'Unlocked': 'success',
    'Locked': 'warning',
    'Unknown': 'neutral'
  });
  
  // Security info
  setStatusBadge('result-blacklist', security.blacklistStatus, {
    'Clean': 'success',
    'Not Blacklisted': 'success', 
    'Blacklisted': 'danger',
    'Lost': 'danger',
    'Stolen': 'danger',
    'Unknown': 'neutral'
  });
  setStatusBadge('result-findmy', security.findMyiPhone, {
    'OFF': 'success',
    'ON': 'warning',
    'Unknown': 'neutral'
  });
  setStatusBadge('result-activation', security.iCloudLock, {
    'Unlocked': 'success',
    'Locked': 'danger',
    'Unknown': 'neutral'
  });
  setStatusBadge('result-mdm', security.mdmLock, {
    'Not Enrolled': 'success',
    'ENROLLED': 'danger',
    'Unknown': 'neutral'
  });
  
  // Warranty
  setStatusBadge('result-warranty', warranty.status, {
    'Active': 'success',
    'AppleCare+': 'success',
    'Limited Warranty': 'success',
    'Expired': 'neutral',
    'Out of Warranty': 'neutral',
    'Unknown': 'neutral'
  });
  setElementText('result-warranty-expiry', warranty.expiry || 'N/A');
  
  // Purchase & AppleCare
  setElementText('result-purchase-date', purchase.date || 'N/A');
  setStatusBadge('result-applecare', warranty.appleCare, {
    'Active': 'success',
    'Not Active': 'neutral',
    'Unknown': 'neutral'
  });
  
  // Device History
  setStatusBadge('result-replaced', history.replaced, {
    'No (Original)': 'success',
    'Yes (Replacement)': 'warning',
    'Unknown': 'neutral'
  });
  setStatusBadge('result-refurbished', history.refurbished, {
    'No': 'success',
    'Yes': 'warning',
    'Unknown': 'neutral'
  });
  setStatusBadge('result-demo', history.demoUnit, {
    'No': 'success',
    'Yes (Demo)': 'warning',
    'Unknown': 'neutral'
  });
  
  // Analysis
  setElementText('result-fraud-score', analysis.riskScore ?? 0);
  setElementText('result-trust-score', analysis.trustScore ? `${analysis.trustScore}%` : '100%');
  
  const overallBadge = document.getElementById('result-overall-status');
  if (overallBadge) {
    const statusClass = analysis.overallStatus === 'clean' ? 'success' :
                        analysis.overallStatus === 'high_risk' ? 'danger' :
                        analysis.overallStatus === 'caution' ? 'warning' : 
                        analysis.overallStatus === 'minor_issues' ? 'warning' : 'neutral';
    overallBadge.className = `status-badge ${statusClass}`;
    overallBadge.innerHTML = `${analysis.statusEmoji || '✓'} ${analysis.statusMessage || 'Check Complete'}`;
  }
  
  const flagsContainer = document.getElementById('result-flags');
  if (flagsContainer) {
    let flagsHtml = '';
    
    // Critical issues
    if (analysis.criticalIssues?.length > 0) {
      flagsHtml += analysis.criticalIssues
        .map(f => `<div class="flag-item danger">${f}</div>`)
        .join('');
    }
    
    // Warnings
    if (analysis.warnings?.length > 0) {
      flagsHtml += analysis.warnings
        .map(f => `<div class="flag-item warning">${f}</div>`)
        .join('');
    }
    
    // Positives
    if (analysis.positives?.length > 0) {
      flagsHtml += analysis.positives
        .map(f => `<div class="flag-item success">${f}</div>`)
        .join('');
    }
    
    // Recommendation
    if (analysis.recommendation) {
      flagsHtml += `<div class="flag-item recommendation">💡 ${analysis.recommendation}</div>`;
    }
    
    if (!flagsHtml) {
      flagsHtml = '<div class="flag-item success">✅ No issues detected</div>';
    }
    
    flagsContainer.innerHTML = flagsHtml;
  }
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text ?? 'N/A';
}

function setStatusBadge(id, value, statusMap) {
  const el = document.getElementById(id);
  if (!el) return;
  
  const displayValue = value || 'Unknown';
  const statusClass = statusMap[displayValue] || 'neutral';
  
  el.innerHTML = `<span class="status-chip ${statusClass}"><span class="dot"></span>${displayValue}</span>`;
}

function showProgress() {
  if (DOM.progressSection) {
    DOM.progressSection.classList.add('visible');
    document.querySelectorAll('.progress-step').forEach((step, i) => {
      step.classList.remove('active', 'complete');
      const statusEl = step.querySelector('.step-status');
      if (statusEl) statusEl.textContent = 'Waiting...';
    });
  }
}

function hideProgress() {
  if (DOM.progressSection) {
    DOM.progressSection.classList.remove('visible');
  }
}

function updateProgressStep(stepNum, status, text) {
  const step = document.querySelector(`.progress-step[data-step="${stepNum}"]`);
  if (step) {
    step.classList.remove('active', 'complete');
    step.classList.add(status);
    const statusEl = step.querySelector('.step-status');
    if (statusEl) statusEl.textContent = text;
  }
}

function showError(title, message) {
  if (DOM.errorSection) {
    if (DOM.errorTitle) DOM.errorTitle.textContent = title;
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
    DOM.errorSection.classList.add('visible');
  }
}

function hideError() {
  if (DOM.errorSection) {
    DOM.errorSection.classList.remove('visible');
  }
}

function hideResults() {
  if (DOM.resultsSection) {
    DOM.resultsSection.classList.remove('visible');
  }
}

function setLoadingState(loading) {
  if (DOM.checkBtn) {
    DOM.checkBtn.classList.toggle('loading', loading);
    DOM.checkBtn.disabled = loading;
  }
}

function showDebug(data) {
  if (DOM.debugSection && DOM.debugOutput) {
    DOM.debugOutput.textContent = JSON.stringify(data, null, 2);
    DOM.debugSection.style.display = 'block';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Public API
window.FixologyIMEI = {
  check: runImeiCheck,
  
  getLastResult: () => IMEI_STATE.lastResult,
  
  newCheck: () => {
    if (DOM.input) DOM.input.value = '';
    if (DOM.counter) DOM.counter.textContent = '0/15';
    if (DOM.validationStatus) DOM.validationStatus.innerHTML = '';
    if (DOM.checkBtn) DOM.checkBtn.disabled = true;
    hideResults();
    hideError();
    IMEI_STATE.lastResult = null;
    DOM.input?.focus();
  },
  
  copyResults: () => {
    const data = IMEI_STATE.lastResult;
    if (!data) {
      alert('No results to copy');
      return;
    }
    
    let text = `IMEI Check Report - Fixology\n`;
    text += `================================\n`;
    text += `IMEI: ${data.imei}\n`;
    text += `Mode: ${data.mode?.toUpperCase() || 'BASIC'}\n\n`;
    
    if (data.device) {
      text += `Device: ${data.device.model || 'Unknown'}\n`;
      text += `Brand: ${data.device.brand || 'Unknown'}\n`;
    }
    
    if (data.analysis) {
      text += `\nStatus: ${data.analysis.statusMessage || 'N/A'}\n`;
      text += `Trust Score: ${data.analysis.trustScore || 'N/A'}%\n`;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Results copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy results');
    });
  },
  
  downloadPDF: () => {
    alert('PDF export coming soon!');
  },
  
  clearCache: () => {
    localStorage.removeItem('fixology-imei-cache');
    console.log('✅ Cache cleared');
  },
  
  setDebugMode: (enabled) => {
    IMEI_CONFIG.debugMode = enabled;
    console.log(`Debug mode: ${enabled ? 'ON' : 'OFF'}`);
  },
  
  testApi: async () => {
    console.log('🧪 Testing API connection...');
    try {
      const resp = await fetch(IMEI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: '353456789012345', mode: 'basic' })
      });
      const data = await resp.json();
      console.log('API Response:', data);
      return data;
    } catch (e) {
      console.error('API Error:', e);
      return { error: e.message };
    }
  }
};

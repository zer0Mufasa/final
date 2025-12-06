/**
 * Fixology IMEI Intelligence Engine v1.0
 * Frontend for IMEI verification
 */

const IMEI_CONFIG = {
  apiEndpoint: 'https://final-git-main-mufasas-projects.vercel.app/api/imei-check',
  debugMode: true // Set to false for production
};

const IMEI_STATE = {
  isLoading: false,
  lastResult: null
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
    debugOutput: document.getElementById('debug-output')
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
  
  console.log('✅ Fixology IMEI Engine v1.0 initialized');
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
  
  IMEI_STATE.isLoading = true;
  setLoadingState(true);
  hideError();
  hideResults();
  showProgress();
  
  console.log(`🔍 Checking IMEI: ${imei}`);
  
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
      body: JSON.stringify({ imei })
    });
    
    updateProgressStep(2, 'complete', 'Connected ✓');
    updateProgressStep(3, 'active', 'Retrieving device data...');
    
    const data = await response.json();
    
    console.log('📦 API Response:', data);
    
    if (!response.ok || !data.success) {
      throw new Error(data.reason || data.message || 'Check failed');
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
  const { summary, analysis } = data;
  
  if (!summary) {
    showError('No Data', 'The verification service returned no device data.');
    return;
  }
  
  // Device info
  setElementText('result-model', summary.model || 'Unknown Device');
  setElementText('result-brand', summary.brand || 'Unknown');
  setElementText('result-storage', summary.storage || 'N/A');
  setElementText('result-color', summary.color || 'N/A');
  setElementText('result-serial', summary.serial || 'N/A');
  setElementText('result-imei', data.imei || 'N/A');
  
  // Network info
  setElementText('result-carrier', summary.carrier || 'Unknown');
  setElementText('result-country', summary.country || 'N/A');
  setStatusBadge('result-simlock', summary.simLock, {
    'Unlocked': 'success',
    'Locked': 'warning'
  });
  
  // Security info
  setStatusBadge('result-blacklist', summary.blacklist, {
    'Clean': 'success',
    'Blacklisted': 'danger'
  });
  setStatusBadge('result-findmy', summary.findMy, {
    'OFF': 'success',
    'ON': 'warning'
  });
  setStatusBadge('result-activation', summary.activationLock, {
    'OFF': 'success',
    'ON': 'danger'
  });
  setStatusBadge('result-mdm', summary.mdm, {
    'OFF': 'success',
    'ON': 'danger'
  });
  
  // Warranty
  setStatusBadge('result-warranty', summary.warranty, {
    'Active': 'success',
    'Expired': 'neutral'
  });
  setElementText('result-warranty-expiry', summary.warrantyExpiry || 'N/A');
  
  // Analysis
  if (analysis) {
    setElementText('result-fraud-score', analysis.fraudScore);
    setElementText('result-trust-score', `${analysis.trustScore}%`);
    
    const overallBadge = document.getElementById('result-overall-status');
    if (overallBadge) {
      overallBadge.className = `status-badge ${analysis.overallStatus}`;
      overallBadge.innerHTML = analysis.statusMessage;
    }
    
    const flagsContainer = document.getElementById('result-flags');
    if (flagsContainer && analysis.flags) {
      if (analysis.flags.length > 0) {
        flagsContainer.innerHTML = analysis.flags
          .map(f => `<div class="flag-item">⚠️ ${f}</div>`)
          .join('');
      } else {
        flagsContainer.innerHTML = '<div class="flag-item success">✅ No issues detected</div>';
      }
    }
  }
  
  if (DOM.resultsSection) {
    DOM.resultsSection.classList.add('visible');
    DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        body: JSON.stringify({ imei: '353456789012345' })
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

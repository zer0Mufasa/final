/**
 * Fixology API Utilities
 * Common functions for all API endpoints
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://fixologyai.com',
  'https://www.fixologyai.com',
  'https://final-bice-phi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function setCorsHeaders(res, req) {
  const origin = req?.headers?.origin || '*';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function handleCors(req, res) {
  setCorsHeaders(res, req);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// DATABASE HELPERS (JSON File Based)
// ═══════════════════════════════════════════════════════════════════

const DATA_DIR = path.join(__dirname, '..', 'data');

async function readDatabase(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return empty structure
      if (filename.endsWith('.json')) {
        return filename.includes('log') ? [] : {};
      }
      return [];
    }
    console.error(`Error reading ${filename}:`, err);
    throw err;
  }
}

async function writeDatabase(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    throw err;
  }
}

async function appendToLog(filename, entry) {
  try {
    const logs = await readDatabase(filename);
    if (!Array.isArray(logs)) {
      throw new Error('Log file must be an array');
    }
    logs.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    // Keep only last 10000 entries
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    await writeDatabase(filename, logs);
    return true;
  } catch (err) {
    console.error(`Error appending to ${filename}:`, err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// UUID GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateUUID() {
  return crypto.randomUUID();
}

function generateShortId() {
  return crypto.randomBytes(4).toString('hex');
}

// ═══════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 characters
  return password && password.length >= 8;
}

function validateRequired(obj, fields) {
  const missing = [];
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      missing.push(field);
    }
  }
  return missing;
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, '');
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSE HELPERS
// ═══════════════════════════════════════════════════════════════════

function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    ...data
  });
}

function sendError(res, message, statusCode = 400, details = null) {
  const response = {
    success: false,
    error: message
  };
  if (details) response.details = details;
  res.status(statusCode).json(response);
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  ALLOWED_ORIGINS,
  setCorsHeaders,
  handleCors,
  readDatabase,
  writeDatabase,
  appendToLog,
  generateUUID,
  generateShortId,
  validateEmail,
  validatePassword,
  validateRequired,
  sanitizeInput,
  sendSuccess,
  sendError
};


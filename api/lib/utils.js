/**
 * Fixology API Utilities
 * Common functions for all API endpoints
 */

const crypto = require('crypto');
const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Stripe-Signature');
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
// DATABASE HELPERS (Redis Based)
// ═══════════════════════════════════════════════════════════════════

async function readDatabase(key) {
  try {
    // Map old filenames to Redis keys
    const keyMap = {
      'users.json': 'db:users',
      'shop-users.json': 'db:shops',
      'memory.json': 'db:memory',
      'imei-log.json': 'db:imei-log',
      'diagnostics-log.json': 'db:diagnostics-log',
      'websites.json': 'db:websites',
      'wiki.json': 'db:wiki',
      'prices.json': 'db:prices',
      'auth-log.json': 'db:auth-log',
      'reset-tokens.json': 'db:reset-tokens'
    };
    
    const redisKey = keyMap[key] || `db:${key.replace('.json', '')}`;
    const data = await redis.get(redisKey);
    
    if (data === null) {
      // Return appropriate empty structure
      if (key.includes('log')) return [];
      if (key === 'memory.json') return { conversations: {} };
      if (key === 'users.json') return { users: [] };
      if (key === 'shop-users.json') return { shops: [] };
      if (key === 'wiki.json') return { articles: [] };
      if (key === 'websites.json') return { websites: [] };
      return {};
    }
    
    return data;
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
    // Return empty structure on error
    if (key.includes('log')) return [];
    return {};
  }
}

async function writeDatabase(key, data) {
  try {
    const keyMap = {
      'users.json': 'db:users',
      'shop-users.json': 'db:shops',
      'memory.json': 'db:memory',
      'imei-log.json': 'db:imei-log',
      'diagnostics-log.json': 'db:diagnostics-log',
      'websites.json': 'db:websites',
      'wiki.json': 'db:wiki',
      'prices.json': 'db:prices',
      'auth-log.json': 'db:auth-log',
      'reset-tokens.json': 'db:reset-tokens'
    };
    
    const redisKey = keyMap[key] || `db:${key.replace('.json', '')}`;
    await redis.set(redisKey, data);
    return true;
  } catch (err) {
    console.error(`Error writing ${key}:`, err);
    throw err;
  }
}

async function appendToLog(key, entry) {
  try {
    const logs = await readDatabase(key);
    const logArray = Array.isArray(logs) ? logs : [];
    
    logArray.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 entries (reduced for Redis storage efficiency)
    if (logArray.length > 1000) {
      logArray.splice(0, logArray.length - 1000);
    }
    
    await writeDatabase(key, logArray);
    return true;
  } catch (err) {
    console.error(`Error appending to ${key}:`, err);
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


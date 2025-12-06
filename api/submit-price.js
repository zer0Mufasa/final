/**
 * Fixology Repair Shop Intelligence API - Submit Price (Crowdsourcing)
 * 
 * POST /api/submit-price
 * Allow users to submit repair pricing data
 * 
 * Input: { 
 *   shop_name: string,
 *   zipcode: string, 
 *   device: string,
 *   repair: string,
 *   grade_a_price?: number,
 *   grade_b_price?: number,
 *   grade_c_price?: number,
 *   time_mins?: number,
 *   notes?: string
 * }
 * Output: { success: boolean, message: string, submission: object }
 */

const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://fixologyai.com',
  'https://www.fixologyai.com',
  'https://final-bice-phi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function setCorsHeaders(res, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════════
// DATA HANDLING
// ═══════════════════════════════════════════════════════════════

const PRICES_FILE = path.join(__dirname, '..', 'data', 'prices.json');

async function loadPrices() {
  try {
    const data = await fs.readFile(PRICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading prices.json:', error);
    return { prices: [] };
  }
}

async function savePrices(data) {
  try {
    await fs.writeFile(PRICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving prices.json:', error);
    throw new Error('Failed to save pricing data.');
  }
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

function validateSubmission(data) {
  const errors = [];

  if (!data.shop_name || typeof data.shop_name !== 'string' || data.shop_name.trim().length < 2) {
    errors.push('shop_name is required and must be at least 2 characters');
  }

  if (!data.zipcode || !/^\d{5}$/.test(data.zipcode)) {
    errors.push('zipcode is required and must be a valid 5-digit US zipcode');
  }

  if (!data.device || typeof data.device !== 'string' || data.device.trim().length < 3) {
    errors.push('device is required and must be at least 3 characters');
  }

  if (!data.repair || typeof data.repair !== 'string' || data.repair.trim().length < 3) {
    errors.push('repair type is required and must be at least 3 characters');
  }

  // At least one price must be provided
  const hasPrice = data.grade_a_price || data.grade_b_price || data.grade_c_price;
  if (!hasPrice) {
    errors.push('At least one price (grade_a_price, grade_b_price, or grade_c_price) is required');
  }

  // Validate price ranges
  if (data.grade_a_price && (data.grade_a_price < 1 || data.grade_a_price > 2000)) {
    errors.push('grade_a_price must be between $1 and $2000');
  }
  if (data.grade_b_price && (data.grade_b_price < 1 || data.grade_b_price > 2000)) {
    errors.push('grade_b_price must be between $1 and $2000');
  }
  if (data.grade_c_price && (data.grade_c_price < 1 || data.grade_c_price > 2000)) {
    errors.push('grade_c_price must be between $1 and $2000');
  }

  // Grade A should be >= Grade B >= Grade C
  if (data.grade_a_price && data.grade_b_price && data.grade_a_price < data.grade_b_price) {
    errors.push('grade_a_price should be greater than or equal to grade_b_price');
  }
  if (data.grade_b_price && data.grade_c_price && data.grade_b_price < data.grade_c_price) {
    errors.push('grade_b_price should be greater than or equal to grade_c_price');
  }

  // Validate time if provided
  if (data.time_mins && (data.time_mins < 5 || data.time_mins > 480)) {
    errors.push('time_mins must be between 5 and 480 minutes');
  }

  return errors;
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'price_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Normalize device name for device_id
 */
function generateDeviceId(device) {
  return device.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

/**
 * Normalize repair type
 */
function normalizeRepair(repair) {
  return repair.toLowerCase()
    .replace(/replacement/gi, '')
    .replace(/repair/gi, '')
    .trim()
    .replace(/\s+/g, '_');
}

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING (Simple in-memory)
// ═══════════════════════════════════════════════════════════════

const submissionHistory = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_HOUR = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const history = submissionHistory.get(ip) || [];
  
  // Clean old entries
  const recentSubmissions = history.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_HOUR) {
    return false;
  }
  
  recentSubmissions.push(now);
  submissionHistory.set(ip, recentSubmissions);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Maximum 10 submissions per hour.',
        retry_after: '1 hour'
      });
    }

    const body = req.body || {};

    // Validate submission
    const validationErrors = validateSubmission(body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationErrors,
        example: {
          shop_name: "Fixology STL",
          zipcode: "63033",
          device: "iPhone 14 Pro Max",
          repair: "screen",
          grade_a_price: 149,
          grade_b_price: 99,
          time_mins: 25
        }
      });
    }

    // Create submission entry
    const submission = {
      id: generateId(),
      zipcode: body.zipcode.trim(),
      device: body.device.trim(),
      device_id: generateDeviceId(body.device),
      repair: normalizeRepair(body.repair),
      grade_a_price: body.grade_a_price ? parseFloat(body.grade_a_price) : null,
      grade_b_price: body.grade_b_price ? parseFloat(body.grade_b_price) : null,
      grade_c_price: body.grade_c_price ? parseFloat(body.grade_c_price) : null,
      time_mins: body.time_mins ? parseInt(body.time_mins) : null,
      shop: body.shop_name.trim(),
      shop_id: null, // Will be matched to existing shop or create new
      notes: body.notes ? body.notes.trim().substring(0, 500) : null,
      reported_at: new Date().toISOString().split('T')[0],
      verified: false, // Crowdsourced submissions start unverified
      source: 'crowdsourced',
      ip_hash: require('crypto').createHash('sha256').update(clientIp).digest('hex').substring(0, 16)
    };

    // Load existing prices and add new submission
    const priceData = await loadPrices();
    priceData.prices.push(submission);

    // Save updated prices
    await savePrices(priceData);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Price submitted successfully! Thank you for contributing.',
      submission: {
        id: submission.id,
        shop: submission.shop,
        device: submission.device,
        repair: submission.repair,
        prices: {
          grade_a: submission.grade_a_price,
          grade_b: submission.grade_b_price,
          grade_c: submission.grade_c_price
        },
        time_mins: submission.time_mins,
        status: 'pending_verification'
      },
      meta: {
        verification_note: 'Submissions are reviewed before being marked as verified.',
        points_earned: 10, // Gamification hint
        thank_you: 'Your contribution helps the repair community!'
      }
    });

  } catch (error) {
    console.error('Submit price error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit pricing data.',
      message: error.message
    });
  }
};


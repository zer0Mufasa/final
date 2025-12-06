/**
 * Fixology Repair Shop Intelligence API - Pricing Endpoint
 * 
 * POST /api/pricing
 * Get pricing comparisons for a specific device repair
 * 
 * Input: { device: string, repair: string, zipcode?: string, grade?: string }
 * Output: { 
 *   success: boolean,
 *   cheapest: { shop, price, grade },
 *   fastest: { shop, time_mins },
 *   bestValue: { shop, price, time, rating },
 *   average_price: { grade_a, grade_b, grade_c },
 *   average_time_mins: number,
 *   all_prices: PriceEntry[]
 * }
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

let cachedPrices = null;
let cachedDevices = null;
let cachedShops = null;

async function loadPrices() {
  if (cachedPrices) return cachedPrices;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'prices.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedPrices = JSON.parse(data);
    return cachedPrices;
  } catch (error) {
    console.error('Error loading prices.json:', error);
    throw new Error('Failed to load pricing data.');
  }
}

async function loadDevices() {
  if (cachedDevices) return cachedDevices;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'devices.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedDevices = JSON.parse(data);
    return cachedDevices;
  } catch (error) {
    console.error('Error loading devices.json:', error);
    throw new Error('Failed to load device data.');
  }
}

async function loadShops() {
  if (cachedShops) return cachedShops;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'shops.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedShops = JSON.parse(data);
    return cachedShops;
  } catch (error) {
    console.error('Error loading shops.json:', error);
    throw new Error('Failed to load shop data.');
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize device name for matching
 */
function normalizeDevice(device) {
  return device.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/iphone/i, 'iphone')
    .replace(/samsung/i, 'samsung')
    .replace(/galaxy/i, 'galaxy');
}

/**
 * Normalize repair type for matching
 */
function normalizeRepair(repair) {
  return repair.toLowerCase().trim()
    .replace(/\s+/g, '_')
    .replace(/replacement/gi, '')
    .replace(/repair/gi, '')
    .trim()
    .replace(/_+$/, '');
}

/**
 * Calculate value score (lower is better)
 * Considers price, time, and rating
 */
function calculateValueScore(price, time, rating, verified) {
  // Normalize each factor (0-1 scale, lower is better except rating)
  const priceScore = price / 300; // Assuming max price ~$300
  const timeScore = time / 120; // Assuming max time ~120 mins
  const ratingScore = (5 - rating) / 5; // Invert rating (higher rating = lower score)
  const verifiedBonus = verified ? -0.1 : 0;
  
  return (priceScore * 0.4) + (timeScore * 0.3) + (ratingScore * 0.3) + verifiedBonus;
}

/**
 * Get shop details by ID
 */
function getShopById(shops, shopId) {
  return shops.find(s => s.id === shopId) || null;
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

  // Accept both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.' 
    });
  }

  try {
    // Parse input
    let input = {};
    if (req.method === 'GET') {
      input = req.query || {};
    } else {
      input = req.body || {};
    }

    const { 
      device, 
      repair, 
      zipcode,
      grade, // 'a', 'b', or 'c' - if specified, only show that grade
      include_unverified = true
    } = input;

    // Validate required fields
    if (!device) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: device',
        example: { device: 'iPhone 14 Pro Max', repair: 'screen', zipcode: '63033' }
      });
    }

    if (!repair) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: repair',
        example: { device: 'iPhone 14 Pro Max', repair: 'screen', zipcode: '63033' }
      });
    }

    // Load data
    const [priceData, deviceData, shopData] = await Promise.all([
      loadPrices(),
      loadDevices(),
      loadShops()
    ]);

    const prices = priceData.prices || [];
    const devices = deviceData.devices || [];
    const repairTypes = deviceData.repair_types || {};
    const shops = shopData.shops || [];

    // Normalize search terms
    const normalizedDevice = normalizeDevice(device);
    const normalizedRepair = normalizeRepair(repair);

    // Filter prices matching device and repair
    let matchingPrices = prices.filter(p => {
      const deviceMatch = normalizeDevice(p.device).includes(normalizedDevice) ||
                          normalizedDevice.includes(normalizeDevice(p.device));
      const repairMatch = normalizeRepair(p.repair) === normalizedRepair ||
                          p.repair.toLowerCase().includes(normalizedRepair);
      const zipcodeMatch = !zipcode || p.zipcode === zipcode;
      const verifiedMatch = include_unverified || p.verified;
      
      return deviceMatch && repairMatch && zipcodeMatch && verifiedMatch;
    });

    // If no exact matches, try broader search
    if (matchingPrices.length === 0) {
      matchingPrices = prices.filter(p => {
        const deviceMatch = normalizeDevice(p.device).includes(normalizedDevice.split(' ')[0]);
        const repairMatch = normalizeRepair(p.repair) === normalizedRepair;
        return deviceMatch && repairMatch;
      });
    }

    if (matchingPrices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pricing data found for this device and repair combination.',
        searched: { device: normalizedDevice, repair: normalizedRepair, zipcode },
        suggestion: 'Try submitting a price at POST /api/submit-price'
      });
    }

    // Enrich prices with shop data
    const enrichedPrices = matchingPrices.map(p => {
      const shop = getShopById(shops, p.shop_id);
      return {
        ...p,
        shop_rating: shop?.rating || 4.0,
        shop_verified: shop?.verified || false,
        shop_warranty: shop?.warranty_days || 30
      };
    });

    // Calculate statistics
    const gradeAPrices = enrichedPrices.filter(p => p.grade_a_price).map(p => p.grade_a_price);
    const gradeBPrices = enrichedPrices.filter(p => p.grade_b_price).map(p => p.grade_b_price);
    const gradeCPrices = enrichedPrices.filter(p => p.grade_c_price).map(p => p.grade_c_price);
    const times = enrichedPrices.map(p => p.time_mins);

    const avgGradeA = gradeAPrices.length > 0 ? Math.round(gradeAPrices.reduce((a, b) => a + b, 0) / gradeAPrices.length) : null;
    const avgGradeB = gradeBPrices.length > 0 ? Math.round(gradeBPrices.reduce((a, b) => a + b, 0) / gradeBPrices.length) : null;
    const avgGradeC = gradeCPrices.length > 0 ? Math.round(gradeCPrices.reduce((a, b) => a + b, 0) / gradeCPrices.length) : null;
    const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

    // Find cheapest (by grade)
    let cheapest = null;
    const sortedByPrice = [...enrichedPrices].sort((a, b) => {
      const priceA = grade === 'b' ? a.grade_b_price : grade === 'c' ? a.grade_c_price : a.grade_a_price;
      const priceB = grade === 'b' ? b.grade_b_price : grade === 'c' ? b.grade_c_price : b.grade_a_price;
      return (priceA || 999) - (priceB || 999);
    });
    
    if (sortedByPrice.length > 0) {
      const cheapestEntry = sortedByPrice[0];
      const cheapestPrice = grade === 'b' ? cheapestEntry.grade_b_price : 
                           grade === 'c' ? cheapestEntry.grade_c_price : 
                           cheapestEntry.grade_b_price || cheapestEntry.grade_a_price;
      cheapest = {
        shop: cheapestEntry.shop,
        shop_id: cheapestEntry.shop_id,
        price: cheapestPrice,
        grade: cheapestEntry.grade_b_price && !grade ? 'B' : grade?.toUpperCase() || 'A',
        verified: cheapestEntry.verified
      };
    }

    // Find fastest
    let fastest = null;
    const sortedByTime = [...enrichedPrices].sort((a, b) => a.time_mins - b.time_mins);
    if (sortedByTime.length > 0) {
      const fastestEntry = sortedByTime[0];
      fastest = {
        shop: fastestEntry.shop,
        shop_id: fastestEntry.shop_id,
        time_mins: fastestEntry.time_mins,
        price: fastestEntry.grade_a_price,
        verified: fastestEntry.verified
      };
    }

    // Find best value (balance of price, time, rating)
    let bestValue = null;
    const withScores = enrichedPrices.map(p => ({
      ...p,
      value_score: calculateValueScore(
        p.grade_a_price || p.grade_b_price,
        p.time_mins,
        p.shop_rating,
        p.verified
      )
    }));
    const sortedByValue = withScores.sort((a, b) => a.value_score - b.value_score);
    
    if (sortedByValue.length > 0) {
      const bestEntry = sortedByValue[0];
      bestValue = {
        shop: bestEntry.shop,
        shop_id: bestEntry.shop_id,
        price: bestEntry.grade_a_price,
        time_mins: bestEntry.time_mins,
        rating: bestEntry.shop_rating,
        warranty_days: bestEntry.shop_warranty,
        verified: bestEntry.verified,
        value_score: Math.round((1 - bestEntry.value_score) * 100) // Convert to 0-100 scale
      };
    }

    // Get repair type info
    const repairInfo = repairTypes[normalizedRepair] || {
      name: repair,
      avg_time: avgTime
    };

    // Format all prices for response
    const allPrices = enrichedPrices.map(p => ({
      shop: p.shop,
      shop_id: p.shop_id,
      grade_a_price: p.grade_a_price,
      grade_b_price: p.grade_b_price,
      grade_c_price: p.grade_c_price,
      time_mins: p.time_mins,
      rating: p.shop_rating,
      warranty_days: p.shop_warranty,
      verified: p.verified,
      reported_at: p.reported_at
    }));

    return res.status(200).json({
      success: true,
      device: device,
      repair: repairInfo.name || repair,
      repair_type: normalizedRepair,
      cheapest,
      fastest,
      bestValue,
      average_price: {
        grade_a: avgGradeA,
        grade_b: avgGradeB,
        grade_c: avgGradeC
      },
      average_time_mins: avgTime,
      price_range: {
        min: Math.min(...[...gradeAPrices, ...gradeBPrices, ...gradeCPrices].filter(Boolean)),
        max: Math.max(...gradeAPrices.filter(Boolean))
      },
      all_prices: allPrices,
      meta: {
        count: allPrices.length,
        zipcode: zipcode || 'all',
        grade_filter: grade || 'all',
        data_freshness: 'Last 30 days'
      }
    });

  } catch (error) {
    console.error('Pricing API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve pricing data.',
      message: error.message
    });
  }
};


/**
 * Fixology Repair Shop Intelligence API - Shop Locator
 * 
 * POST /api/shops
 * Find nearby repair shops by zipcode or IP geolocation
 * 
 * Input: { zipcode?: string, lat?: number, lng?: number, radius?: number, services?: string[] }
 * Output: { success: boolean, shops: Shop[], meta: { count, radius, zipcode } }
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

let cachedShops = null;

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
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in miles
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Get coordinates from zipcode using our local lookup table
 */
function getZipcodeCoordinates(zipcode, zipcodeMap) {
  if (zipcodeMap && zipcodeMap[zipcode]) {
    return zipcodeMap[zipcode];
  }
  // Default to Florissant, MO area if zipcode not found
  return { lat: 38.7892, lng: -90.3226 };
}

/**
 * Check if shop is currently open
 */
function isShopOpen(hours) {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || todayHours === 'closed') {
    return false;
  }
  
  const [open, close] = todayHours.split('-');
  const [openHour, openMin] = open.split(':').map(Number);
  const [closeHour, closeMin] = close.split(':').map(Number);
  
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openHour * 60 + openMin;
  const closeMins = closeHour * 60 + closeMin;
  
  return currentMins >= openMins && currentMins <= closeMins;
}

/**
 * Format shop for API response
 */
function formatShop(shop, distance) {
  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    address: `${shop.address.street}, ${shop.address.city}, ${shop.address.state} ${shop.address.zipcode}`,
    city: shop.address.city,
    state: shop.address.state,
    zipcode: shop.address.zipcode,
    distance_miles: Math.round(distance * 10) / 10,
    phone: shop.phone,
    website: shop.website,
    rating: shop.rating,
    review_count: shop.review_count,
    services: shop.services,
    brands: shop.brands_serviced,
    hours: shop.hours,
    is_open: isShopOpen(shop.hours),
    verified: shop.verified,
    certified: shop.certified,
    warranty_days: shop.warranty_days,
    same_day_service: shop.same_day_service,
    mail_in_service: shop.mail_in_service,
    walk_in_welcome: shop.walk_in_welcome,
    features: shop.features
  };
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
    // Parse input from query params (GET) or body (POST)
    let input = {};
    if (req.method === 'GET') {
      input = req.query || {};
    } else {
      input = req.body || {};
    }

    const { 
      zipcode, 
      lat, 
      lng, 
      radius = 25, // Default 25 mile radius
      services,
      sort = 'distance', // distance, rating, name
      limit = 10
    } = input;

    // Load shop data
    const shopData = await loadShops();
    const shops = shopData.shops || [];
    const zipcodeMap = shopData.zipcode_coordinates || {};

    // Determine search coordinates
    let searchLat, searchLng, searchZipcode;
    
    if (lat && lng) {
      searchLat = parseFloat(lat);
      searchLng = parseFloat(lng);
      searchZipcode = zipcode || 'custom';
    } else if (zipcode) {
      const coords = getZipcodeCoordinates(zipcode, zipcodeMap);
      searchLat = coords.lat;
      searchLng = coords.lng;
      searchZipcode = zipcode;
    } else {
      // Default to 63033 if no location provided
      searchLat = 38.7892;
      searchLng = -90.3226;
      searchZipcode = '63033';
    }

    // Filter and calculate distances
    let results = shops.map(shop => {
      const distance = calculateDistance(
        searchLat, searchLng,
        shop.coordinates.lat, shop.coordinates.lng
      );
      return { shop, distance };
    });

    // Filter by radius
    results = results.filter(r => r.distance <= parseFloat(radius));

    // Filter by services if specified
    if (services) {
      const serviceList = Array.isArray(services) ? services : services.split(',');
      results = results.filter(r => 
        serviceList.every(s => r.shop.services.includes(s.trim().toLowerCase()))
      );
    }

    // Sort results
    switch (sort) {
      case 'rating':
        results.sort((a, b) => b.shop.rating - a.shop.rating);
        break;
      case 'name':
        results.sort((a, b) => a.shop.name.localeCompare(b.shop.name));
        break;
      case 'distance':
      default:
        results.sort((a, b) => a.distance - b.distance);
    }

    // Apply limit
    results = results.slice(0, parseInt(limit));

    // Format response
    const formattedShops = results.map(r => formatShop(r.shop, r.distance));

    return res.status(200).json({
      success: true,
      shops: formattedShops,
      meta: {
        count: formattedShops.length,
        total_available: shops.length,
        search_zipcode: searchZipcode,
        search_coordinates: { lat: searchLat, lng: searchLng },
        radius_miles: parseFloat(radius),
        sort_by: sort,
        services_filter: services || null
      }
    });

  } catch (error) {
    console.error('Shop locator error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve shop data.',
      message: error.message
    });
  }
};


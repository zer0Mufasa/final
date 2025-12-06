/**
 * Fixology Chat API - Serverless Function
 * POST /api/fixology-chat
 * 
 * Provider-agnostic AI assistant for device diagnostics,
 * IMEI checks, and Fixology platform support.
 */

const fs = require('fs').promises;
const path = require('path');

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

function setCorsHeaders(res, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════════════
// DATA LOADERS
// ═══════════════════════════════════════════════════════════════════

let cachedDevices = null;
let cachedSymptoms = null;
let cachedRewards = null;
let cachedPricing = null;
let cachedShops = null;
let cachedRepairPrices = null;

async function loadDevices() {
  if (cachedDevices) return cachedDevices;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'devices.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedDevices = JSON.parse(data);
    return cachedDevices;
  } catch (err) {
    console.error('Failed to load devices.json:', err.message);
    return null;
  }
}

async function loadSymptoms() {
  if (cachedSymptoms) return cachedSymptoms;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'symptoms.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedSymptoms = JSON.parse(data);
    return cachedSymptoms;
  } catch (err) {
    console.error('Failed to load symptoms.json:', err.message);
    return null;
  }
}

async function loadRewards() {
  if (cachedRewards) return cachedRewards;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'rewards.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedRewards = JSON.parse(data);
    return cachedRewards;
  } catch (err) {
    console.error('Failed to load rewards.json:', err.message);
    return null;
  }
}

async function loadPricing() {
  if (cachedPricing) return cachedPricing;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'pricing.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedPricing = JSON.parse(data);
    return cachedPricing;
  } catch (err) {
    console.error('Failed to load pricing.json:', err.message);
    return null;
  }
}

async function loadShops() {
  if (cachedShops) return cachedShops;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'shops.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedShops = JSON.parse(data);
    return cachedShops;
  } catch (err) {
    console.error('Failed to load shops.json:', err.message);
    return null;
  }
}

/**
 * Fetch real shops from Google Places or Yelp API
 * @param {string} location - Any location: "lat,lng", zipcode, city, address, etc.
 */
async function fetchRealShops(location) {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const YELP_API_KEY = process.env.YELP_API_KEY;
  
  if (!location) {
    console.log('No location provided for shop search');
    return null;
  }
  
  let lat = null, lng = null;
  let locationName = location;
  
  // Check if location is already coordinates (lat,lng format)
  const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    lat = parseFloat(coordMatch[1]);
    lng = parseFloat(coordMatch[2]);
    locationName = `Coordinates: ${lat}, ${lng}`;
    console.log(`Using provided coordinates: ${lat}, ${lng}`);
  }
  // Otherwise, geocode the location
  else if (GOOGLE_API_KEY) {
    try {
      // Google Geocoding API handles ANY location format
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      if (geoData.status === 'OK' && geoData.results?.[0]?.geometry?.location) {
        lat = geoData.results[0].geometry.location.lat;
        lng = geoData.results[0].geometry.location.lng;
        locationName = geoData.results[0].formatted_address || location;
        console.log(`Geocoded "${location}" to: ${lat}, ${lng} (${locationName})`);
      } else {
        console.log(`Geocoding failed for "${location}": ${geoData.status}`);
      }
    } catch (e) {
      console.error('Geocoding error:', e);
    }
  }
  
  // If no API key or geocoding failed, we cannot find real shops
  if (lat === null || lng === null) {
    console.log('Cannot geocode location - no API key or geocoding failed');
    return null;
  }
  
  // Try Google Places
  if (GOOGLE_API_KEY) {
    try {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=16093&keyword=cell%20phone%20repair&type=store&key=${GOOGLE_API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (searchData.results && searchData.results.length > 0) {
        // Get details for top 5 results
        const shops = await Promise.all(
          searchData.results.slice(0, 5).map(async (place) => {
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,rating,user_ratings_total,opening_hours&key=${GOOGLE_API_KEY}`;
              const detailsRes = await fetch(detailsUrl);
              const detailsData = await detailsRes.json();
              const d = detailsData.result || {};
              
              const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
              
              return {
                name: d.name || place.name,
                address: d.formatted_address || place.vicinity,
                phone: d.formatted_phone_number || 'Call for info',
                distance: Math.round(distance * 10) / 10,
                rating: d.rating || place.rating || 4.0,
                review_count: d.user_ratings_total || place.user_ratings_total || 0,
                same_day: true,
                warranty: 30,
                features: ['Walk-ins Welcome'],
                source: 'google_places'
              };
            } catch (e) {
              return null;
            }
          })
        );
        
        return shops.filter(s => s !== null);
      }
    } catch (e) {
      console.error('Google Places error:', e);
    }
  }
  
  // Try Yelp as fallback
  if (YELP_API_KEY) {
    try {
      const yelpUrl = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&radius=16000&categories=mobilephonerepair&sort_by=distance&limit=5`;
      const yelpRes = await fetch(yelpUrl, {
        headers: { 'Authorization': `Bearer ${YELP_API_KEY}` }
      });
      const yelpData = await yelpRes.json();
      
      if (yelpData.businesses && yelpData.businesses.length > 0) {
        return yelpData.businesses.map(b => {
          const distance = calculateDistance(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
          return {
            name: b.name,
            address: b.location.display_address.join(', '),
            phone: b.display_phone || 'Call for info',
            distance: Math.round(distance * 10) / 10,
            rating: b.rating || 4.0,
            review_count: b.review_count || 0,
            same_day: !b.is_closed,
            warranty: 30,
            features: b.categories?.map(c => c.title) || [],
            source: 'yelp'
          };
        });
      }
    } catch (e) {
      console.error('Yelp error:', e);
    }
  }
  
  return null; // No real API available
}

async function loadRepairPrices() {
  if (cachedRepairPrices) return cachedRepairPrices;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'prices.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedRepairPrices = JSON.parse(data);
    return cachedRepairPrices;
  } catch (err) {
    console.error('Failed to load prices.json:', err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT DETECTION
// ═══════════════════════════════════════════════════════════════════

function detectIntent(message) {
  const lower = message.toLowerCase();
  
  // Check for shop finder queries (HIGHEST PRIORITY)
  const shopPatterns = [
    /near(by|est)?\s*(shop|store|repair|me)/i,
    /shop(s)?\s*(near|close|around)/i,
    /find.*(shop|store|repair|technician)/i,
    /where.*(repair|fix|shop)/i,
    /local\s*(shop|repair|store)/i,
    /repair\s*shop/i,
    /(in|around|near)\s*\d{5}/i,  // zipcode mention
    /location/i,
    /\b63\d{3}\b/,  // Missouri zipcodes
    /closest/i,
    /recommendation/i
  ];
  
  for (const pattern of shopPatterns) {
    if (pattern.test(message)) {
      return 'shop_finder';
    }
  }
  
  // Check for repair pricing queries (not subscription pricing)
  const repairPricingPatterns = [
    /how much.*(screen|battery|repair|fix|replace)/i,
    /(screen|battery|port|glass|camera)\s*(repair|replace).*(cost|price)/i,
    /(cost|price).*(screen|battery|repair|fix|replace)/i,
    /repair\s*(cost|price|estimate)/i,
    /quote/i,
    /estimate/i
  ];
  
  for (const pattern of repairPricingPatterns) {
    if (pattern.test(message)) {
      return 'repair_pricing';
    }
  }
  
  // Check for IMEI-related queries
  const imeiPatterns = [
    /imei/i,
    /\b\d{14,17}\b/,  // 14-17 digit number
    /blacklist/i,
    /is.*(phone|device).*(stolen|lost|clean)/i,
    /find my (iphone|device)/i,
    /carrier.*(lock|unlock)/i,
    /sim.*(lock|unlock)/i,
    /check.*(serial|status)/i,
    /icloud.*(lock|status)/i,
    /mdm.*(lock|status)/i,
    /activation lock/i
  ];
  
  for (const pattern of imeiPatterns) {
    if (pattern.test(message)) {
      return 'imei_check';
    }
  }
  
  // Check for subscription pricing queries
  const pricingPatterns = [
    /subscription/i,
    /\b(plan|plans)\b/i,
    /\b(basic|pro|enterprise)\b.*plan/i,
    /per month/i,
    /monthly/i,
    /free trial/i,
    /fixology.*(pric|cost)/i
  ];
  
  for (const pattern of pricingPatterns) {
    if (pattern.test(message)) {
      return 'pricing';
    }
  }
  
  // Check for diagnosis-related queries
  const diagnosisPatterns = [
    /diagnos/i,
    /problem/i,
    /issue/i,
    /broken/i,
    /not working/i,
    /won'?t (turn on|charge|boot|connect)/i,
    /screen.*(crack|black|lines|flicker)/i,
    /battery.*(drain|dead|swollen|hot)/i,
    /water damage/i,
    /overheating/i,
    /slow/i,
    /crash/i,
    /freez/i,
    /restart/i,
    /speaker/i,
    /microphone/i,
    /camera/i,
    /wifi/i,
    /bluetooth/i,
    /charging/i,
    /fix/i,
    /symptom/i
  ];
  
  for (const pattern of diagnosisPatterns) {
    if (pattern.test(message)) {
      return 'diagnosis';
    }
  }
  
  return 'generic_support';
}

// ═══════════════════════════════════════════════════════════════════
// IMEI EXTRACTION & CHECK
// ═══════════════════════════════════════════════════════════════════

function extractIMEI(message) {
  // Look for 14-17 digit sequences (IMEI is typically 15 digits)
  const match = message.match(/\b(\d{14,17})\b/);
  return match ? match[1] : null;
}

function extractLocation(message) {
  // Try to extract the most specific location from the message
  const lower = message.toLowerCase();
  
  // 1. Look for full addresses (number + street)
  const addressMatch = message.match(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|lane|ln|court|ct|place|pl|circle|cir)[\s,]*(?:[\w\s,]+)?(?:\d{5})?/i);
  if (addressMatch) {
    return addressMatch[0].trim();
  }
  
  // 2. Look for "in/near/around [location]" patterns
  const locationPatterns = [
    /(?:in|near|around|close to|by|at)\s+([^,.\n]+(?:,\s*[A-Z]{2})?(?:\s+\d{5})?)/i,
    /shops?\s+(?:in|near|around)\s+([^,.\n]+)/i,
    /(?:my\s+)?(?:address|location)\s+(?:is|:)?\s*([^,.\n]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const loc = match[1].trim();
      // Skip if it's just common words
      if (!['me', 'my', 'here', 'this'].includes(loc.toLowerCase())) {
        return loc;
      }
    }
  }
  
  // 3. Look for city, state patterns
  const cityStateMatch = message.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    return `${cityStateMatch[1]}, ${cityStateMatch[2]}`;
  }
  
  // 4. Look for US zipcode
  const zipcodeMatch = message.match(/\b(\d{5}(?:-\d{4})?)\b/);
  if (zipcodeMatch) {
    return zipcodeMatch[1];
  }
  
  // 5. Look for city names (common ones)
  const cityPatterns = [
    /\b(new york|nyc|manhattan|brooklyn|queens|bronx)\b/i,
    /\b(los angeles|la|hollywood)\b/i,
    /\b(chicago)\b/i,
    /\b(houston)\b/i,
    /\b(phoenix)\b/i,
    /\b(philadelphia|philly)\b/i,
    /\b(san antonio|san diego|san jose|san francisco)\b/i,
    /\b(dallas|austin)\b/i,
    /\b(seattle)\b/i,
    /\b(denver)\b/i,
    /\b(boston)\b/i,
    /\b(atlanta)\b/i,
    /\b(miami)\b/i,
    /\b(st\.?\s*louis|saint louis)\b/i,
    /\b(ballwin|florissant|chesterfield|manchester|kirkwood|clayton|ladue|creve coeur|maryland heights|hazelwood|bridgeton|ferguson|university city)\b/i
  ];
  
  for (const pattern of cityPatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // 6. Check for any capitalized words that might be a city
  const capitalizedWords = message.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g);
  if (capitalizedWords) {
    // Filter out common non-location words
    const excludeWords = ['I', 'The', 'My', 'What', 'Where', 'How', 'Can', 'Please', 'Help', 'Find', 'Shop', 'Repair', 'Phone', 'Screen', 'Battery', 'iPhone', 'Samsung', 'Android'];
    for (const word of capitalizedWords) {
      if (!excludeWords.includes(word) && word.length > 2) {
        return word;
      }
    }
  }
  
  return null; // No location found - let API handle it
}

// Keep old function for backward compatibility
function extractZipcode(message) {
  const location = extractLocation(message);
  // If it's a 5-digit number, return it, otherwise return the full location
  if (location && /^\d{5}$/.test(location)) {
    return location;
  }
  return location || '63033'; // Default to Florissant, MO only if nothing found
}

function extractDeviceAndRepair(message) {
  const lower = message.toLowerCase();
  
  // Device detection
  let device = null;
  const devicePatterns = [
    { pattern: /iphone\s*14\s*pro\s*max/i, name: 'iPhone 14 Pro Max' },
    { pattern: /iphone\s*14\s*pro/i, name: 'iPhone 14 Pro' },
    { pattern: /iphone\s*14/i, name: 'iPhone 14' },
    { pattern: /iphone\s*13\s*pro\s*max/i, name: 'iPhone 13 Pro Max' },
    { pattern: /iphone\s*13\s*pro/i, name: 'iPhone 13 Pro' },
    { pattern: /iphone\s*13/i, name: 'iPhone 13' },
    { pattern: /iphone\s*12/i, name: 'iPhone 12' },
    { pattern: /iphone/i, name: 'iPhone' },
    { pattern: /samsung\s*(galaxy\s*)?s24\s*ultra/i, name: 'Samsung Galaxy S24 Ultra' },
    { pattern: /samsung\s*(galaxy\s*)?s24/i, name: 'Samsung Galaxy S24' },
    { pattern: /samsung\s*(galaxy\s*)?s23/i, name: 'Samsung Galaxy S23' },
    { pattern: /samsung/i, name: 'Samsung' },
    { pattern: /ps5|playstation\s*5/i, name: 'PlayStation 5' },
    { pattern: /xbox/i, name: 'Xbox Series X' },
    { pattern: /switch/i, name: 'Nintendo Switch' },
    { pattern: /macbook/i, name: 'MacBook' },
    { pattern: /ipad/i, name: 'iPad' }
  ];
  
  for (const { pattern, name } of devicePatterns) {
    if (pattern.test(message)) {
      device = name;
      break;
    }
  }
  
  // Repair type detection
  let repair = null;
  const repairPatterns = [
    { pattern: /screen/i, name: 'screen' },
    { pattern: /battery/i, name: 'battery' },
    { pattern: /charg(ing|er)\s*(port)?/i, name: 'charging_port' },
    { pattern: /back\s*glass/i, name: 'back_glass' },
    { pattern: /camera/i, name: 'camera' },
    { pattern: /hdmi/i, name: 'hdmi_port' },
    { pattern: /joy.?con/i, name: 'joycon' }
  ];
  
  for (const { pattern, name } of repairPatterns) {
    if (pattern.test(message)) {
      repair = name;
      break;
    }
  }
  
  return { device, repair };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearby shops sorted by distance
 */
function getNearbyShops(shopsData, zipcode, limit = 5) {
  if (!shopsData || !shopsData.shops) return [];
  
  const coords = shopsData.zipcode_coordinates?.[zipcode] || { lat: 38.7892, lng: -90.3226 };
  
  const shopsWithDistance = shopsData.shops.map(shop => ({
    ...shop,
    distance: calculateDistance(coords.lat, coords.lng, shop.coordinates.lat, shop.coordinates.lng)
  }));
  
  shopsWithDistance.sort((a, b) => a.distance - b.distance);
  
  return shopsWithDistance.slice(0, limit).map(shop => ({
    name: shop.name,
    address: `${shop.address.street}, ${shop.address.city}, ${shop.address.state} ${shop.address.zipcode}`,
    phone: shop.phone,
    distance: Math.round(shop.distance * 10) / 10,
    rating: shop.rating,
    review_count: shop.review_count,
    services: shop.services,
    same_day: shop.same_day_service,
    warranty: shop.warranty_days,
    features: shop.features
  }));
}

/**
 * Get repair pricing for a device
 */
function getRepairPricing(pricesData, device, repair, zipcode) {
  if (!pricesData || !pricesData.prices) return null;
  
  const matchingPrices = pricesData.prices.filter(p => {
    const deviceMatch = device ? p.device.toLowerCase().includes(device.toLowerCase()) : true;
    const repairMatch = repair ? p.repair === repair : true;
    const zipcodeMatch = zipcode ? p.zipcode === zipcode : true;
    return deviceMatch && repairMatch && zipcodeMatch;
  });
  
  if (matchingPrices.length === 0) return null;
  
  // Calculate averages
  const gradeAPrices = matchingPrices.filter(p => p.grade_a_price).map(p => p.grade_a_price);
  const gradeBPrices = matchingPrices.filter(p => p.grade_b_price).map(p => p.grade_b_price);
  const times = matchingPrices.map(p => p.time_mins);
  
  return {
    prices: matchingPrices.map(p => ({
      shop: p.shop,
      grade_a: p.grade_a_price,
      grade_b: p.grade_b_price,
      time_mins: p.time_mins
    })),
    avg_grade_a: gradeAPrices.length > 0 ? Math.round(gradeAPrices.reduce((a, b) => a + b, 0) / gradeAPrices.length) : null,
    avg_grade_b: gradeBPrices.length > 0 ? Math.round(gradeBPrices.reduce((a, b) => a + b, 0) / gradeBPrices.length) : null,
    avg_time: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    cheapest: matchingPrices.reduce((min, p) => {
      const price = p.grade_b_price || p.grade_a_price;
      return price < (min?.price || Infinity) ? { shop: p.shop, price } : min;
    }, null)
  };
}

/**
 * Check IMEI with specified mode
 * @param {string} imei - The IMEI number to check
 * @param {string} mode - 'basic' (free, limited info) or 'deep' (full info)
 */
async function checkIMEI(imei, mode = 'basic') {
  try {
    console.log(`Checking IMEI ${imei} with mode: ${mode}`);
    
    const response = await fetch('https://final-bice-phi.vercel.app/api/imei-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imei: imei, mode: mode })
    });
    
    if (!response.ok) {
      throw new Error(`IMEI API returned ${response.status}`);
    }
    
    const data = await response.json();
    data.checkMode = mode; // Track which mode was used
    return data;
  } catch (err) {
    console.error('IMEI check failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Determine if user wants a deep check based on their message
 */
function wantsDeepCheck(message) {
  const lower = message.toLowerCase();
  const deepPatterns = [
    /deep\s*check/i,
    /full\s*check/i,
    /detailed/i,
    /complete/i,
    /thorough/i,
    /all\s*info/i,
    /everything/i,
    /blacklist/i,
    /carrier/i,
    /warranty/i,
    /find\s*my/i,
    /icloud/i,
    /lock\s*status/i,
    /mdm/i,
    /is\s*(it|this)\s*(stolen|safe|clean)/i,
    /should\s*i\s*buy/i,
    /safe\s*to\s*(buy|purchase)/i
  ];
  
  for (const pattern of deepPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// LLM CALL (PROVIDER-AGNOSTIC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Calls the configured LLM provider.
 * 
 * Environment variables required:
 * - LLM_PROVIDER: "anthropic" or "openai"
 * - LLM_API_KEY: Your API key for the chosen provider
 * 
 * Optional:
 * - LLM_MODEL: Override the default model
 */
async function callLLM({ systemPrompt, messages, context }) {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const apiKey = process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }
  
  // Build the full message array
  const fullMessages = messages.map(m => ({
    role: m.role === 'system' ? 'user' : m.role,
    content: m.content
  }));
  
  // Add context to the last user message if provided
  if (context && fullMessages.length > 0) {
    const lastIdx = fullMessages.length - 1;
    if (fullMessages[lastIdx].role === 'user') {
      fullMessages[lastIdx].content += `\n\n[CONTEXT DATA]\n${JSON.stringify(context, null, 2)}`;
    }
  }
  
  if (provider === 'openai') {
    return await callOpenAI({ systemPrompt, messages: fullMessages, apiKey });
  } else if (provider === 'anthropic') {
    return await callAnthropic({ systemPrompt, messages: fullMessages, apiKey });
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

async function callOpenAI({ systemPrompt, messages, apiKey }) {
  const model = process.env.LLM_MODEL || 'gpt-4o';
  
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 1024,
    temperature: 0.7
  };
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return { text: data.choices[0]?.message?.content || '' };
}

async function callAnthropic({ systemPrompt, messages, apiKey }) {
  const model = process.env.LLM_MODEL || 'claude-sonnet-4-20250514';
  
  const requestBody = {
    model: model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  };
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return { text: data.content[0]?.text || '' };
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildSystemPrompt({ intent, devices, symptoms, rewards, pricing, imeiData, shopsData, repairPricing, role }) {
  const basePrompt = `You are Fixology AI, the official diagnostic assistant for Fixology (fixologyai.com).

IDENTITY:
- You are built by certified repair technicians with real-world repair experience.
- You represent Fixology's diagnostic intelligence engine.
- You are NOT ChatGPT, GPT, OpenAI, Claude, or Anthropic. You are Fixology AI.
- Never say "as an AI language model" or reference your underlying technology.

CAPABILITIES:
- Device diagnostics for phones, tablets, laptops, gaming consoles, smartwatches, and earbuds
- IMEI/serial number checks for device status, blacklist, Find My, carrier lock
- Find nearby repair shops with real-time pricing
- Repair cost estimates from local shops
- Pricing and plan information for Fixology's services

TONE & STYLE:
- Be confident, clear, and professional
- Give direct answers without unnecessary hedging
- Use short paragraphs and bullet points for readability
- No emojis in responses
- Don't be overly verbose - get to the point

FIXOLOGY PLATFORM INFO:
- Customer plan: FREE - unlimited AI diagnostics, price estimates, safety warnings
- Shop Pro plan: $149/month - POS, invoicing, inventory, CRM, SMS auto-replies, website chatbot
- Enterprise: Custom pricing - multi-location, API access, insurance claims integration
- Fixology Rewards: Earn Fix Points on repairs (10 FP per $1), redeem for discounts

ROLE CONTEXT: ${role === 'shop' ? 'User is a repair shop technician/owner using the Fixology dashboard.' : 'User is a customer seeking help with their device.'}`;

  let contextSection = '\n\nDATA CONTEXT:';
  
  // Add relevant device info summary
  if (devices) {
    const totalModels = devices.total_models || 347;
    const categories = devices.categories?.map(c => c.name).join(', ') || 'Phones, Tablets, Laptops, Desktops, Consoles, Wearables';
    contextSection += `\n- Supported devices: ${totalModels}+ models across ${categories}`;
  }
  
  // Add symptoms summary for diagnosis intent
  if (intent === 'diagnosis' && symptoms) {
    const categories = symptoms.categories?.map(c => `${c.name} (${c.symptoms?.length || 0} symptoms)`).join(', ');
    contextSection += `\n- Diagnostic database: ${symptoms.total_symptoms || 547} symptoms across categories: ${categories}`;
    contextSection += `\n- Full symptoms data available for detailed diagnostics`;
  }
  
  // Add pricing details for pricing intent
  if (intent === 'pricing' && pricing) {
    contextSection += `\n- IMEI Plans: Basic ($29/mo, 100 credits), Pro ($79/mo, 400 credits), Enterprise ($199/mo, unlimited)`;
    contextSection += `\n- Credit packs available: 50 for $15, 100 for $25, 250 for $50`;
  }
  
  // Add rewards summary
  if (rewards) {
    contextSection += `\n- Rewards tiers: Bronze (1x), Silver (1.25x at 2,500 FP), Gold (1.5x at 7,500 FP), Platinum (2x at 20,000 FP)`;
  }
  
  // Add IMEI data if present
  if (imeiData && imeiData.success) {
    contextSection += `\n\n[IMEI CHECK RESULTS]\n${JSON.stringify(imeiData, null, 2)}`;
  }
  
  // Add nearby shops data if present
  if (shopsData && shopsData.length > 0) {
    contextSection += `\n\n[NEARBY REPAIR SHOPS - REAL DATA]\n`;
    shopsData.forEach((shop, i) => {
      contextSection += `\n${i + 1}. ${shop.name}`;
      contextSection += `\n   Address: ${shop.address}`;
      contextSection += `\n   Phone: ${shop.phone}`;
      contextSection += `\n   Distance: ${shop.distance} miles`;
      contextSection += `\n   Rating: ${shop.rating}/5 (${shop.review_count} reviews)`;
      contextSection += `\n   Same-day service: ${shop.same_day ? 'Yes' : 'No'}`;
      contextSection += `\n   Warranty: ${shop.warranty} days`;
      contextSection += `\n   Features: ${shop.features?.join(', ') || 'N/A'}\n`;
    });
  }
  
  // Add repair pricing data if present
  if (repairPricing && repairPricing.prices) {
    contextSection += `\n\n[REPAIR PRICING - REAL DATA]\n`;
    contextSection += `Average Grade A (OEM): $${repairPricing.avg_grade_a || 'N/A'}\n`;
    contextSection += `Average Grade B (Aftermarket): $${repairPricing.avg_grade_b || 'N/A'}\n`;
    contextSection += `Average repair time: ${repairPricing.avg_time || 'N/A'} minutes\n`;
    if (repairPricing.cheapest) {
      contextSection += `Cheapest option: ${repairPricing.cheapest.shop} at $${repairPricing.cheapest.price}\n`;
    }
    contextSection += `\nPricing by shop:\n`;
    repairPricing.prices.forEach(p => {
      contextSection += `- ${p.shop}: Grade A $${p.grade_a || 'N/A'}, Grade B $${p.grade_b || 'N/A'}, ~${p.time_mins} mins\n`;
    });
  }

  let intentGuidelines = '\n\nRESPONSE GUIDELINES:';
  
  switch (intent) {
    case 'shop_finder':
      intentGuidelines += `
- USE THE REAL SHOP DATA PROVIDED ABOVE - these are REAL shops from Google Places API
- You can find repair shops ANYWHERE in the world using real-time Google Places data
- List the shops with their actual names, addresses, phone numbers, and distances
- Highlight the closest shop first
- Mention ratings and review counts from Google
- If NO SHOP DATA is provided above, politely ask the user for their location (city, address, or zipcode)
- NEVER make up fake shop names, addresses, or phone numbers
- NEVER use sample data or placeholder information
- Only show shops that appear in the REAL SHOP DATA section above
- Recommend calling ahead to confirm availability
- Format as a clean, numbered list`;
      break;
      
    case 'repair_pricing':
      intentGuidelines += `
- USE THE REAL PRICING DATA PROVIDED ABOVE - do NOT make up prices
- Explain the difference between Grade A (OEM) and Grade B (Aftermarket) parts
- Mention the cheapest option and the shop offering it
- Provide the average price range
- Note typical repair time
- Suggest asking about warranty when visiting`;
      break;
    
    case 'imei_check':
      intentGuidelines += `
- TWO CHECK TYPES: Basic (free, device model only) vs Deep (full security analysis)
- If BASIC check was done (limitedInfo=true): Show device model, mention they can run a DEEP check for full details
- If DEEP check was done: Show complete analysis with all security flags, trust score, and clear recommendation
- Highlight critical issues: blacklist status, Find My iPhone, iCloud Lock, MDM, Lost Mode
- Provide clear recommendation: ✅ SAFE TO PURCHASE, ⚠️ CAUTION, or 🚫 DO NOT BUY
- If no IMEI provided, ask for the 15-digit IMEI number
- Explain how to find IMEI: dial *#06# or check Settings > General > About
- To trigger deep check, user can say: "deep check", "full check", "is it safe to buy", "check blacklist"`;
      break;
      
    case 'diagnosis':
      intentGuidelines += `
- Ask 1-2 clarifying questions maximum to narrow down the issue
- Map symptoms to likely causes based on our diagnostic database
- Suggest specific diagnostic tests the user can perform
- Provide estimated repair difficulty and rough price range if applicable
- Flag any safety concerns (swollen battery, water damage, etc.)
- For shops: Include technical repair notes`;
      break;
      
    case 'pricing':
      intentGuidelines += `
- Provide clear pricing information based on user's needs
- For customers: Emphasize the FREE diagnostic tier
- For shops: Explain Shop Pro ($149/mo) vs Enterprise
- Mention IMEI credit pricing if relevant
- Note the free trial for early access shops`;
      break;
      
    default:
      intentGuidelines += `
- Answer questions about Fixology's services and capabilities
- Guide users to the right feature for their needs
- For general device questions, offer to help diagnose if they have an issue`;
  }
  
  return basePrompt + contextSection + intentGuidelines;
}

// ═══════════════════════════════════════════════════════════════════
// SUGGESTED ACTIONS GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateSuggestedActions(intent, imeiData, shopsData, repairPricing) {
  const actions = [];
  
  switch (intent) {
    case 'shop_finder':
      if (shopsData && shopsData.length > 0) {
        actions.push(`Call ${shopsData[0].name}`);
        actions.push('Get directions');
        actions.push('Compare repair prices');
      } else {
        actions.push('Enter your zipcode');
        actions.push('Search by city name');
      }
      break;
      
    case 'repair_pricing':
      if (repairPricing) {
        actions.push('Find nearest shop');
        actions.push('Compare all prices');
        actions.push('Book appointment');
      } else {
        actions.push('Tell me your device model');
        actions.push('What needs repair?');
      }
      break;
    
    case 'imei_check':
      if (imeiData?.success) {
        // If basic check was done, offer deep check
        if (imeiData.limitedInfo || imeiData.mode === 'basic') {
          actions.push('Run deep check for full details');
          actions.push('Check another IMEI');
        }
        // If deep check found issues
        else if (imeiData.analysis?.overallStatus === 'high_risk' || imeiData.analysis?.overallStatus === 'flagged') {
          actions.push('Contact seller about device status');
          actions.push('Request proof of purchase');
          actions.push('Check another device');
        } 
        // If deep check found warnings
        else if (imeiData.analysis?.overallStatus === 'caution' || imeiData.analysis?.overallStatus === 'warning') {
          actions.push('Ask seller about Find My status');
          actions.push('Verify device ownership');
          actions.push('Check another device');
        } 
        // Clean device
        else {
          actions.push('Proceed with purchase');
          actions.push('Run diagnostic check');
          actions.push('Find repair shops nearby');
        }
      } else {
        actions.push('Enter IMEI to check device');
        actions.push('Dial *#06# to find IMEI');
      }
      break;
      
    case 'diagnosis':
      actions.push('Describe your device issue');
      actions.push('Check device warranty status');
      actions.push('Find a Fixology partner shop');
      break;
      
    case 'pricing':
      actions.push('Start free trial');
      actions.push('Compare all plans');
      actions.push('Contact sales for Enterprise');
      break;
      
    default:
      actions.push('Diagnose a device');
      actions.push('Check an IMEI');
      actions.push('Find repair shops near me');
  }
  
  return actions;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

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
      error: 'Method not allowed. Use POST.',
      debug: `Received ${req.method}`
    });
  }
  
  try {
    const body = req.body || {};
    const { sessionId, role = 'customer', messages, userLocation } = body;
    
    // Log user location if available
    if (userLocation) {
      console.log(`User location available: ${userLocation.source} - ${userLocation.lat}, ${userLocation.lng}${userLocation.city ? ` (${userLocation.city})` : ''}`);
    }
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid messages array',
        debug: 'Request body must include messages: [{ role, content }, ...]'
      });
    }
    
    // Get the last user message for intent detection
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return res.status(400).json({
        success: false,
        error: 'No user message found',
        debug: 'At least one message must have role: "user"'
      });
    }
    
    // Detect intent
    const intent = detectIntent(lastUserMessage.content);
    
    // Load relevant data
    const [devices, symptoms, rewards, pricing, shops, repairPricesData] = await Promise.all([
      loadDevices(),
      loadSymptoms(),
      loadRewards(),
      loadPricing(),
      loadShops(),
      loadRepairPrices()
    ]);
    
    // Handle IMEI check if applicable
    let imeiData = null;
    if (intent === 'imei_check') {
      const imeiCandidate = extractIMEI(lastUserMessage.content);
      if (imeiCandidate) {
        // Determine check mode based on user's message
        const useDeepCheck = wantsDeepCheck(lastUserMessage.content);
        const checkMode = useDeepCheck ? 'deep' : 'basic';
        
        console.log(`IMEI check requested: ${imeiCandidate}, mode: ${checkMode}`);
        imeiData = await checkIMEI(imeiCandidate, checkMode);
      }
    }
    
    // Handle shop finder - use Google Places API for ANY location worldwide
    // NO STATIC/SAMPLE DATA - only real results from Google Places
    let shopsData = null;
    let searchLocation = null;
    let locationSource = null;
    
    if (intent === 'shop_finder') {
      // First try to extract location from the message
      searchLocation = extractLocation(lastUserMessage.content);
      
      if (searchLocation) {
        locationSource = 'message';
        console.log(`Shop finder: Using location from message "${searchLocation}"`);
      }
      // If no location in message, use automatic location (GPS or IP)
      else if (userLocation && userLocation.lat && userLocation.lng) {
        // Use coordinates directly - most accurate
        searchLocation = `${userLocation.lat},${userLocation.lng}`;
        locationSource = userLocation.source || 'auto';
        console.log(`Shop finder: Using automatic ${locationSource} location: ${searchLocation}${userLocation.city ? ` (${userLocation.city})` : ''}`);
      }
      
      if (searchLocation) {
        // Use Google Places API - returns REAL shops with REAL addresses
        const realShops = await fetchRealShops(searchLocation);
        if (realShops && realShops.length > 0) {
          shopsData = realShops;
          console.log(`Found ${realShops.length} real shops near ${searchLocation}`);
        } else {
          console.log(`No shops found or API error for "${searchLocation}"`);
        }
      } else {
        console.log('Shop finder: No location available - will ask user');
      }
      
      // NEVER use static data - if no results, the AI will ask for location
    }
    
    // Handle repair pricing
    let repairPricing = null;
    if (intent === 'repair_pricing' || intent === 'shop_finder') {
      const { device, repair } = extractDeviceAndRepair(lastUserMessage.content);
      const zipcode = extractZipcode(lastUserMessage.content);
      if (device || repair) {
        repairPricing = getRepairPricing(repairPricesData, device, repair, zipcode);
      }
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      intent,
      devices,
      symptoms,
      rewards,
      pricing,
      imeiData,
      shopsData,
      repairPricing,
      role
    });
    
    // Build context for LLM
    const context = {};
    if (intent === 'diagnosis' && symptoms) {
      context.symptomCategories = symptoms.categories?.map(c => ({
        name: c.name,
        symptoms: c.symptoms?.slice(0, 5).map(s => s.name)
      }));
    }
    if (intent === 'pricing' && pricing) {
      context.pricing = pricing;
    }
    if (imeiData) {
      context.imeiResult = imeiData;
    }
    if (shopsData) {
      context.nearbyShops = shopsData;
    }
    if (repairPricing) {
      context.repairPricing = repairPricing;
    }
    
    // Call LLM
    const llmResponse = await callLLM({
      systemPrompt,
      messages,
      context: Object.keys(context).length > 0 ? context : null
    });
    
    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(intent, imeiData, shopsData, repairPricing);
    
    // Build response
    const response = {
      success: true,
      intent,
      reply: llmResponse.text,
      meta: {
        suggestedActions
      }
    };
    
    // Add IMEI data to meta if present
    if (imeiData) {
      response.meta.imei = {
        checked: true,
        status: imeiData.success ? imeiData.analysis?.overallStatus : 'error',
        summary: imeiData.success ? imeiData.summary : null,
        analysis: imeiData.success ? imeiData.analysis : null
      };
    }
    
    // Add shops data to meta if present
    if (shopsData && shopsData.length > 0) {
      response.meta.shops = shopsData;
    }
    
    // Add repair pricing to meta if present
    if (repairPricing) {
      response.meta.pricing = {
        avg_grade_a: repairPricing.avg_grade_a,
        avg_grade_b: repairPricing.avg_grade_b,
        avg_time: repairPricing.avg_time,
        cheapest: repairPricing.cheapest,
        shop_count: repairPricing.prices?.length || 0
      };
    }
    
    return res.status(200).json(response);
    
  } catch (err) {
    console.error('Fixology Chat Error:', err);
    
    return res.status(500).json({
      success: false,
      error: 'Something went wrong processing your request. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


/**
 * Fixology Repair Shop Intelligence API - Shop Locator
 * 
 * POST /api/shops
 * Find REAL nearby repair shops using Google Places API
 * 
 * Input: { zipcode?: string, lat?: number, lng?: number, radius?: number }
 * Output: { success: boolean, shops: Shop[], meta: { count, radius, source } }
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
// GEOCODING - Convert zipcode to coordinates
// ═══════════════════════════════════════════════════════════════

async function geocodeZipcode(zipcode) {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    // Fallback coordinates for known zipcodes
    const fallbackCoords = {
      '63033': { lat: 38.7892, lng: -90.3226 },
      '63031': { lat: 38.8012, lng: -90.3412 },
      '63042': { lat: 38.7698, lng: -90.3789 },
      '63121': { lat: 38.7012, lng: -90.3098 },
      '63135': { lat: 38.7442, lng: -90.2954 }
    };
    return fallbackCoords[zipcode] || { lat: 38.7892, lng: -90.3226 };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return { lat: 38.7892, lng: -90.3226 }; // Default to Florissant, MO
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE PLACES API - Find real repair shops
// ═══════════════════════════════════════════════════════════════

async function searchGooglePlaces(lat, lng, radius = 16093) { // 10 miles in meters
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    console.log('No Google Places API key configured');
    return null;
  }

  try {
    // Search for phone repair shops
    const searchTerms = ['cell phone repair', 'phone repair', 'iphone repair', 'mobile phone repair'];
    let allPlaces = [];

    for (const term of searchTerms) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(term)}&type=store&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        allPlaces = allPlaces.concat(data.results);
      }
      
      // Rate limiting - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Deduplicate by place_id
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(p => [p.place_id, p])).values()
    );

    // Get additional details for top results
    const detailedPlaces = await Promise.all(
      uniquePlaces.slice(0, 10).map(async (place) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry&key=${GOOGLE_API_KEY}`;
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.result) {
            return {
              ...place,
              details: detailsData.result
            };
          }
        } catch (e) {
          console.error('Error fetching place details:', e);
        }
        return place;
      })
    );

    return detailedPlaces;
  } catch (error) {
    console.error('Google Places API error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// YELP FUSION API - Alternative source for real shops
// ═══════════════════════════════════════════════════════════════

async function searchYelp(lat, lng, radius = 16093) {
  const YELP_API_KEY = process.env.YELP_API_KEY;
  
  if (!YELP_API_KEY) {
    console.log('No Yelp API key configured');
    return null;
  }

  try {
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&radius=${Math.min(radius, 40000)}&categories=mobilephonerepair,electronicsrepair&sort_by=distance&limit=20`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`
      }
    });
    
    const data = await response.json();
    return data.businesses || null;
  } catch (error) {
    console.error('Yelp API error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// FORMAT RESULTS
// ═══════════════════════════════════════════════════════════════

function formatGooglePlace(place, userLat, userLng) {
  const details = place.details || {};
  const location = details.geometry?.location || place.geometry?.location;
  
  // Calculate distance
  const distance = calculateDistance(userLat, userLng, location.lat, location.lng);
  
  // Parse address
  const address = details.formatted_address || place.vicinity || 'Address not available';
  
  // Check if currently open
  const isOpen = details.opening_hours?.open_now ?? null;
  
  return {
    id: place.place_id,
    name: details.name || place.name,
    address: address,
    phone: details.formatted_phone_number || null,
    website: details.website || null,
    distance_miles: Math.round(distance * 10) / 10,
    rating: details.rating || place.rating || null,
    review_count: details.user_ratings_total || place.user_ratings_total || 0,
    is_open: isOpen,
    hours: details.opening_hours?.weekday_text || null,
    coordinates: location,
    source: 'google_places',
    verified: true
  };
}

function formatYelpBusiness(business, userLat, userLng) {
  const distance = calculateDistance(
    userLat, userLng,
    business.coordinates.latitude,
    business.coordinates.longitude
  );
  
  return {
    id: business.id,
    name: business.name,
    address: business.location.display_address.join(', '),
    phone: business.display_phone || business.phone || null,
    website: business.url || null,
    distance_miles: Math.round(distance * 10) / 10,
    rating: business.rating || null,
    review_count: business.review_count || 0,
    is_open: !business.is_closed,
    hours: null,
    coordinates: {
      lat: business.coordinates.latitude,
      lng: business.coordinates.longitude
    },
    source: 'yelp',
    verified: true,
    image_url: business.image_url || null,
    categories: business.categories?.map(c => c.title) || []
  };
}

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

// ═══════════════════════════════════════════════════════════════
// FALLBACK - Load static data if no API keys
// ═══════════════════════════════════════════════════════════════

let cachedShops = null;

async function loadStaticShops() {
  if (cachedShops) return cachedShops;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'shops.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedShops = JSON.parse(data);
    return cachedShops;
  } catch (error) {
    console.error('Error loading shops.json:', error);
    return { shops: [] };
  }
}

function formatStaticShop(shop, userLat, userLng) {
  const distance = calculateDistance(
    userLat, userLng,
    shop.coordinates.lat, shop.coordinates.lng
  );
  
  return {
    id: shop.id,
    name: shop.name,
    address: `${shop.address.street}, ${shop.address.city}, ${shop.address.state} ${shop.address.zipcode}`,
    phone: shop.phone,
    website: shop.website,
    distance_miles: Math.round(distance * 10) / 10,
    rating: shop.rating,
    review_count: shop.review_count,
    is_open: null, // Unknown for static data
    hours: shop.hours,
    coordinates: shop.coordinates,
    source: 'static_database',
    verified: shop.verified,
    services: shop.services,
    features: shop.features,
    same_day_service: shop.same_day_service,
    warranty_days: shop.warranty_days
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
      radius = 10, // Default 10 mile radius
      limit = 10
    } = input;

    // Determine search coordinates
    let searchLat, searchLng, searchZipcode;
    
    if (lat && lng) {
      searchLat = parseFloat(lat);
      searchLng = parseFloat(lng);
      searchZipcode = zipcode || 'coordinates';
    } else if (zipcode) {
      const coords = await geocodeZipcode(zipcode);
      searchLat = coords.lat;
      searchLng = coords.lng;
      searchZipcode = zipcode;
    } else {
      // Default to 63033 if no location provided
      searchLat = 38.7892;
      searchLng = -90.3226;
      searchZipcode = '63033';
    }

    const radiusMeters = parseFloat(radius) * 1609.34; // Convert miles to meters
    let shops = [];
    let source = 'none';

    // Try Google Places API first
    const googleResults = await searchGooglePlaces(searchLat, searchLng, radiusMeters);
    if (googleResults && googleResults.length > 0) {
      shops = googleResults.map(p => formatGooglePlace(p, searchLat, searchLng));
      source = 'google_places';
    }

    // If no Google results, try Yelp
    if (shops.length === 0) {
      const yelpResults = await searchYelp(searchLat, searchLng, radiusMeters);
      if (yelpResults && yelpResults.length > 0) {
        shops = yelpResults.map(b => formatYelpBusiness(b, searchLat, searchLng));
        source = 'yelp';
      }
    }

    // If still no results, fall back to static data
    if (shops.length === 0) {
      const staticData = await loadStaticShops();
      if (staticData.shops && staticData.shops.length > 0) {
        shops = staticData.shops
          .map(s => formatStaticShop(s, searchLat, searchLng))
          .filter(s => s.distance_miles <= parseFloat(radius));
        source = 'static_database';
      }
    }

    // Sort by distance
    shops.sort((a, b) => a.distance_miles - b.distance_miles);

    // Apply limit
    shops = shops.slice(0, parseInt(limit));

    // Check if using real API or fallback
    const hasRealAPI = !!(process.env.GOOGLE_PLACES_API_KEY || process.env.YELP_API_KEY);

    return res.status(200).json({
      success: true,
      shops: shops,
      meta: {
        count: shops.length,
        search_zipcode: searchZipcode,
        search_coordinates: { lat: searchLat, lng: searchLng },
        radius_miles: parseFloat(radius),
        source: source,
        real_time_data: source !== 'static_database',
        api_configured: hasRealAPI,
        message: !hasRealAPI ? 
          'Using static database. Add GOOGLE_PLACES_API_KEY or YELP_API_KEY environment variable for real-time shop data.' : 
          'Real-time data from ' + source
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

/**
 * Fixology Repair Shop Intelligence API - Device Catalog
 * 
 * GET /api/devices
 * Get list of supported devices and repair types
 * 
 * Query params: 
 *   - brand: Filter by brand (e.g., "Apple", "Samsung")
 *   - category: Filter by category (e.g., "smartphone", "tablet", "laptop", "console")
 *   - search: Search device names
 * 
 * Output: { success: boolean, devices: Device[], repair_types: RepairType[], grades: Grade[] }
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

let cachedDevices = null;

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

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const { brand, category, search, id } = req.query || {};

    // Load device data
    const deviceData = await loadDevices();
    let devices = deviceData.devices || [];
    const repairTypes = deviceData.repair_types || {};
    const grades = deviceData.grades || {};

    // If specific device ID requested
    if (id) {
      const device = devices.find(d => d.id === id);
      if (!device) {
        return res.status(404).json({
          success: false,
          error: 'Device not found',
          searched_id: id
        });
      }

      // Get repair types for this device
      const deviceRepairs = device.repairs.map(r => ({
        id: r,
        ...repairTypes[r]
      }));

      return res.status(200).json({
        success: true,
        device: {
          ...device,
          repair_details: deviceRepairs
        },
        grades
      });
    }

    // Apply filters
    if (brand) {
      devices = devices.filter(d => 
        d.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    if (category) {
      devices = devices.filter(d => 
        d.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      devices = devices.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.brand.toLowerCase().includes(searchLower) ||
        d.id.includes(searchLower)
      );
    }

    // Get unique brands and categories for filtering
    const allDevices = deviceData.devices || [];
    const brands = [...new Set(allDevices.map(d => d.brand))].sort();
    const categories = [...new Set(allDevices.map(d => d.category))].sort();

    return res.status(200).json({
      success: true,
      devices: devices.map(d => ({
        id: d.id,
        name: d.name,
        brand: d.brand,
        category: d.category,
        repairs: d.repairs
      })),
      repair_types: Object.entries(repairTypes).map(([id, data]) => ({
        id,
        ...data
      })),
      grades: Object.entries(grades).map(([id, data]) => ({
        id,
        ...data
      })),
      meta: {
        total_devices: devices.length,
        brands,
        categories,
        filters_applied: {
          brand: brand || null,
          category: category || null,
          search: search || null
        }
      }
    });

  } catch (error) {
    console.error('Devices API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve device data.',
      message: error.message
    });
  }
};


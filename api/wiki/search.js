/**
 * GET /api/wiki/search
 * Search repair wiki articles
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../lib/utils');

// Default wiki articles (will be seeded to Redis on first call)
const DEFAULT_ARTICLES = [
  { id: 1, title: "iPhone Screen Replacement Guide", category: "iPhone", device: "iPhone 14/13/12", tags: ["screen", "display", "lcd", "oled"], difficulty: "Medium", time: "30-45 mins", content: "Complete guide to replacing iPhone screens including tools needed, step-by-step instructions, and common pitfalls to avoid." },
  { id: 2, title: "iPhone Battery Replacement", category: "iPhone", device: "iPhone 11-15", tags: ["battery", "power", "charging"], difficulty: "Easy", time: "15-20 mins", content: "How to safely replace iPhone batteries. Includes battery health tips and calibration instructions." },
  { id: 3, title: "Samsung Galaxy Screen Repair", category: "Samsung", device: "Galaxy S21-S24", tags: ["screen", "amoled", "display"], difficulty: "Hard", time: "45-60 mins", content: "Samsung curved AMOLED screen replacement requires special care. Learn the proper technique." },
  { id: 4, title: "iPad Screen Replacement", category: "iPad", device: "iPad Pro/Air", tags: ["screen", "tablet", "digitizer"], difficulty: "Hard", time: "60-90 mins", content: "iPad screens are more challenging due to adhesive. Complete teardown and reassembly guide." },
  { id: 5, title: "iPhone Charging Port Repair", category: "iPhone", device: "All iPhones", tags: ["charging", "lightning", "usb-c", "port"], difficulty: "Medium", time: "20-30 mins", content: "Fix charging issues by cleaning or replacing the charging port. Includes diagnostic tips." },
  { id: 6, title: "Water Damage Recovery", category: "General", device: "All Devices", tags: ["water", "liquid", "damage", "recovery"], difficulty: "Hard", time: "24-48 hours", content: "Emergency steps for water damaged devices. Rice myth debunked. Professional cleaning techniques." },
  { id: 7, title: "iPhone Face ID Repair", category: "iPhone", device: "iPhone X and later", tags: ["face id", "biometric", "sensor", "camera"], difficulty: "Expert", time: "45-60 mins", content: "Face ID module replacement and calibration. Requires specialized equipment." },
  { id: 8, title: "Samsung Battery Replacement", category: "Samsung", device: "Galaxy S/Note Series", tags: ["battery", "samsung", "power"], difficulty: "Medium", time: "25-35 mins", content: "Samsung battery replacement guide with adhesive removal tips and battery calibration." },
  { id: 9, title: "iPhone Camera Replacement", category: "iPhone", device: "iPhone 11-15", tags: ["camera", "lens", "photo"], difficulty: "Medium", time: "30-40 mins", content: "Replace damaged camera modules. Covers front and rear cameras, stabilization issues." },
  { id: 10, title: "Android Software Troubleshooting", category: "Android", device: "All Android", tags: ["software", "boot", "freeze", "slow"], difficulty: "Easy", time: "15-30 mins", content: "Common Android software issues and fixes. Factory reset, safe mode, cache clearing." },
  { id: 11, title: "iPhone Speaker Replacement", category: "iPhone", device: "All iPhones", tags: ["speaker", "audio", "sound", "earpiece"], difficulty: "Easy", time: "15-20 mins", content: "Fix muffled or no sound issues by replacing speakers. Includes earpiece and loudspeaker." },
  { id: 12, title: "MacBook Screen Replacement", category: "MacBook", device: "MacBook Pro/Air", tags: ["screen", "display", "laptop", "mac"], difficulty: "Expert", time: "60-90 mins", content: "MacBook display assembly replacement. Includes hinge calibration and cable routing." },
  { id: 13, title: "iPhone Microphone Repair", category: "iPhone", device: "All iPhones", tags: ["microphone", "audio", "voice", "call"], difficulty: "Medium", time: "20-30 mins", content: "Diagnose and fix microphone issues. Multiple microphones on modern iPhones explained." },
  { id: 14, title: "Google Pixel Screen Repair", category: "Google", device: "Pixel 6-8", tags: ["screen", "pixel", "google", "oled"], difficulty: "Hard", time: "45-60 mins", content: "Pixel OLED screen replacement with fingerprint sensor considerations." },
  { id: 15, title: "iPhone Vibration Motor Repair", category: "iPhone", device: "All iPhones", tags: ["vibration", "taptic", "motor", "haptic"], difficulty: "Easy", time: "15-20 mins", content: "Replace the Taptic Engine for vibration issues. Simple swap procedure." },
  { id: 16, title: "Samsung Charging Port Fix", category: "Samsung", device: "Galaxy S/A Series", tags: ["charging", "usb-c", "port", "samsung"], difficulty: "Medium", time: "25-35 mins", content: "USB-C port replacement on Samsung devices. Includes flex cable handling." },
  { id: 17, title: "iPad Battery Replacement", category: "iPad", device: "All iPads", tags: ["battery", "tablet", "ipad", "power"], difficulty: "Hard", time: "45-60 mins", content: "iPad battery replacement requires careful adhesive work. Heat gun techniques included." },
  { id: 18, title: "iPhone Back Glass Replacement", category: "iPhone", device: "iPhone 8 and later", tags: ["back glass", "rear", "housing", "crack"], difficulty: "Expert", time: "60-90 mins", content: "Back glass replacement options: laser removal vs housing swap. Pros and cons." },
  { id: 19, title: "AirPods Battery Replacement", category: "Apple", device: "AirPods Pro/3", tags: ["airpods", "battery", "earbuds", "wireless"], difficulty: "Expert", time: "30-45 mins", content: "AirPods are difficult to repair. Battery swap techniques for extending life." },
  { id: 20, title: "Samsung Fold Screen Repair", category: "Samsung", device: "Galaxy Fold/Flip", tags: ["fold", "flip", "flexible", "screen"], difficulty: "Expert", time: "90-120 mins", content: "Foldable display repair is extremely challenging. When to refer to manufacturer." },
  { id: 21, title: "iPhone SIM Tray Issues", category: "iPhone", device: "All iPhones", tags: ["sim", "tray", "stuck", "network"], difficulty: "Easy", time: "5-10 mins", content: "Fix stuck SIM trays and SIM detection issues. Emergency removal techniques." },
  { id: 22, title: "Laptop Keyboard Replacement", category: "Laptop", device: "All Laptops", tags: ["keyboard", "keys", "typing", "laptop"], difficulty: "Medium", time: "30-45 mins", content: "Replace damaged or non-working laptop keyboards. Covers most major brands." },
  { id: 23, title: "iPhone True Tone Calibration", category: "iPhone", device: "iPhone 8 and later", tags: ["true tone", "display", "calibration", "color"], difficulty: "Medium", time: "10-15 mins", content: "Restore True Tone after screen replacement using calibration tools." },
  { id: 24, title: "PS5 Controller Drift Fix", category: "Gaming", device: "DualSense", tags: ["controller", "drift", "joystick", "ps5"], difficulty: "Medium", time: "20-30 mins", content: "Fix analog stick drift on PS5 controllers. Cleaning vs replacement options." },
  { id: 25, title: "Nintendo Switch Joy-Con Repair", category: "Gaming", device: "Nintendo Switch", tags: ["joycon", "drift", "nintendo", "gaming"], difficulty: "Easy", time: "15-25 mins", content: "Joy-Con drift repair guide. Joystick replacement and calibration." },
  { id: 26, title: "iPhone Proximity Sensor Fix", category: "iPhone", device: "All iPhones", tags: ["proximity", "sensor", "call", "screen"], difficulty: "Medium", time: "20-30 mins", content: "Fix screen staying on during calls. Proximity sensor replacement and calibration." },
  { id: 27, title: "Android Bootloop Recovery", category: "Android", device: "All Android", tags: ["bootloop", "stuck", "boot", "recovery"], difficulty: "Medium", time: "30-60 mins", content: "Recover from bootloop using recovery mode, fastboot, and flash tools." },
  { id: 28, title: "MacBook Battery Replacement", category: "MacBook", device: "MacBook Pro/Air", tags: ["battery", "macbook", "laptop", "power"], difficulty: "Hard", time: "45-60 mins", content: "MacBook battery replacement with adhesive removal. Cycle count and health explained." },
  { id: 29, title: "iPhone Power Button Repair", category: "iPhone", device: "All iPhones", tags: ["power", "button", "sleep", "wake"], difficulty: "Medium", time: "25-35 mins", content: "Replace stuck or non-responsive power buttons. Flex cable replacement guide." },
  { id: 30, title: "Tablet Digitizer Replacement", category: "Tablet", device: "Android Tablets", tags: ["digitizer", "touch", "screen", "tablet"], difficulty: "Medium", time: "40-50 mins", content: "Replace touch-only digitizers on budget tablets. Adhesive and alignment tips." },
  { id: 31, title: "iPhone WiFi/Bluetooth Fix", category: "iPhone", device: "All iPhones", tags: ["wifi", "bluetooth", "wireless", "antenna"], difficulty: "Hard", time: "30-45 mins", content: "Diagnose and fix WiFi/Bluetooth issues. Antenna replacement and IC repair." },
  { id: 32, title: "Samsung S Pen Repair", category: "Samsung", device: "Galaxy Note/S Ultra", tags: ["s pen", "stylus", "samsung", "note"], difficulty: "Easy", time: "10-15 mins", content: "S Pen troubleshooting and replacement options. Bluetooth pairing issues." },
  { id: 33, title: "iPhone Volume Button Fix", category: "iPhone", device: "All iPhones", tags: ["volume", "button", "mute", "switch"], difficulty: "Medium", time: "20-30 mins", content: "Replace volume buttons and mute switch. Flex cable routing tips." },
  { id: 34, title: "Laptop Fan Cleaning", category: "Laptop", device: "All Laptops", tags: ["fan", "cooling", "overheating", "dust"], difficulty: "Easy", time: "20-30 mins", content: "Clean laptop fans to fix overheating. Thermal paste reapplication guide." },
  { id: 35, title: "iPhone Headphone Jack Repair", category: "iPhone", device: "iPhone 6s and earlier", tags: ["headphone", "jack", "audio", "3.5mm"], difficulty: "Easy", time: "15-20 mins", content: "Clean or replace headphone jacks on older iPhones." },
  { id: 36, title: "Smart Watch Screen Repair", category: "Wearables", device: "Apple Watch/Galaxy Watch", tags: ["watch", "screen", "wearable", "small"], difficulty: "Expert", time: "45-60 mins", content: "Smart watch displays are tiny and fragile. Specialized techniques required." },
  { id: 37, title: "iPhone GPS Antenna Fix", category: "iPhone", device: "All iPhones", tags: ["gps", "location", "antenna", "maps"], difficulty: "Hard", time: "30-40 mins", content: "Fix GPS issues by replacing antenna or checking connections." },
  { id: 38, title: "Data Recovery Basics", category: "General", device: "All Devices", tags: ["data", "recovery", "backup", "storage"], difficulty: "Medium", time: "Varies", content: "Basic data recovery techniques for damaged devices. When to use professional services." },
  { id: 39, title: "iPhone Flashlight Fix", category: "iPhone", device: "All iPhones", tags: ["flashlight", "led", "light", "camera"], difficulty: "Easy", time: "15-20 mins", content: "Fix non-working flashlight. Often connected to camera flex cable." },
  { id: 40, title: "Android Screen Burn-In Fix", category: "Android", device: "AMOLED Devices", tags: ["burn-in", "ghost", "image", "amoled"], difficulty: "N/A", time: "N/A", content: "Understanding AMOLED burn-in. Prevention tips and why replacement is often needed." },
  { id: 41, title: "Laptop Trackpad Repair", category: "Laptop", device: "All Laptops", tags: ["trackpad", "touchpad", "mouse", "click"], difficulty: "Medium", time: "25-35 mins", content: "Replace or recalibrate laptop trackpads. Click mechanism repair." },
  { id: 42, title: "iPhone NFC Repair", category: "iPhone", device: "iPhone 7 and later", tags: ["nfc", "apple pay", "contactless", "tap"], difficulty: "Hard", time: "30-40 mins", content: "Fix Apple Pay and NFC issues. Antenna replacement and testing." },
  { id: 43, title: "Tablet Charging Port Fix", category: "Tablet", device: "All Tablets", tags: ["charging", "port", "tablet", "usb"], difficulty: "Medium", time: "30-40 mins", content: "Replace charging ports on tablets. Larger connectors but more adhesive." },
  { id: 44, title: "iPhone Touch Disease Fix", category: "iPhone", device: "iPhone 6/6 Plus", tags: ["touch", "disease", "ic", "chip"], difficulty: "Expert", time: "60-90 mins", content: "Touch IC repair for iPhone 6 series. Requires micro-soldering skills." },
  { id: 45, title: "Console HDMI Port Repair", category: "Gaming", device: "PS4/PS5/Xbox", tags: ["hdmi", "port", "display", "console"], difficulty: "Expert", time: "45-60 mins", content: "HDMI port replacement on gaming consoles. Micro-soldering required." },
  { id: 46, title: "iPhone Lidar Sensor Fix", category: "iPhone", device: "iPhone 12 Pro and later", tags: ["lidar", "sensor", "depth", "ar"], difficulty: "Hard", time: "35-45 mins", content: "Lidar sensor replacement for AR and camera features." },
  { id: 47, title: "Wireless Charging Pad Repair", category: "iPhone", device: "iPhone 8 and later", tags: ["wireless", "charging", "qi", "coil"], difficulty: "Medium", time: "25-35 mins", content: "Replace wireless charging coil on iPhones. MagSafe alignment tips." },
  { id: 48, title: "Phone Signal Issues", category: "General", device: "All Phones", tags: ["signal", "antenna", "cellular", "reception"], difficulty: "Medium", time: "Varies", content: "Diagnose poor signal. Software vs hardware causes. Antenna testing." },
  { id: 49, title: "Laptop Port Replacement", category: "Laptop", device: "All Laptops", tags: ["port", "usb", "hdmi", "laptop"], difficulty: "Hard", time: "40-60 mins", content: "Replace damaged USB, HDMI, or other ports. Board-level repair." },
  { id: 50, title: "Device Unlock Services", category: "General", device: "All Devices", tags: ["unlock", "carrier", "icloud", "frp"], difficulty: "Varies", time: "Varies", content: "Understanding device unlocks: carrier unlock, iCloud, FRP. Legal considerations." }
];

async function ensureWikiSeeded() {
  let wikiDb = await readDatabase('wiki.json');
  
  if (!wikiDb.articles || wikiDb.articles.length === 0) {
    wikiDb = {
      articles: DEFAULT_ARTICLES,
      lastUpdated: new Date().toISOString()
    };
    await writeDatabase('wiki.json', wikiDb);
  }
  
  return wikiDb;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const wikiDb = await ensureWikiSeeded();
    const articles = wikiDb.articles || [];

    // Get search params
    const query = (req.query?.q || req.query?.query || '').toLowerCase().trim();
    const category = (req.query?.category || '').toLowerCase();
    const limit = parseInt(req.query?.limit) || 20;

    let results = articles;

    // Filter by search query
    if (query) {
      results = results.filter(article => {
        const searchText = `${article.title} ${article.category} ${article.device} ${article.tags?.join(' ')} ${article.content}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Filter by category
    if (category) {
      results = results.filter(article => 
        article.category.toLowerCase() === category
      );
    }

    // Sort by relevance (simple: title match first)
    if (query) {
      results.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(query) ? 0 : 1;
        const bTitle = b.title.toLowerCase().includes(query) ? 0 : 1;
        return aTitle - bTitle;
      });
    }

    // Limit results
    results = results.slice(0, limit);

    // Get categories for filtering
    const categories = [...new Set(articles.map(a => a.category))];

    return sendSuccess(res, {
      results,
      total: results.length,
      categories,
      query: query || null
    });

  } catch (err) {
    console.error('Wiki search error:', err.message);
    return sendError(res, 'Search failed', 500);
  }
};

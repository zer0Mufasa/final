/**
 * POST /api/website/save
 * Save website configuration for a shop
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

const THEMES = {
  lavender: {
    name: 'Lavender Dreams',
    primary: '#a78bfa',
    secondary: '#06b6d4',
    background: '#0a0a0f',
    card: '#12121a',
    text: '#ffffff'
  },
  neon: {
    name: 'Neon Nights',
    primary: '#00ff88',
    secondary: '#ff00ff',
    background: '#0d0d0d',
    card: '#1a1a1a',
    text: '#ffffff'
  },
  minimal: {
    name: 'Minimal White',
    primary: '#000000',
    secondary: '#666666',
    background: '#ffffff',
    card: '#f5f5f5',
    text: '#000000'
  },
  darkglass: {
    name: 'Dark Glass',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#000000',
    card: 'rgba(255,255,255,0.05)',
    text: '#ffffff'
  },
  cleanwhite: {
    name: 'Clean White',
    primary: '#2563eb',
    secondary: '#10b981',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b'
  }
};

const DEFAULT_SECTIONS = [
  { id: 'hero', type: 'hero', enabled: true, order: 0 },
  { id: 'about', type: 'about', enabled: true, order: 1 },
  { id: 'services', type: 'services', enabled: true, order: 2 },
  { id: 'pricing', type: 'pricing', enabled: true, order: 3 },
  { id: 'reviews', type: 'reviews', enabled: true, order: 4 },
  { id: 'contact', type: 'contact', enabled: true, order: 5 }
];

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const auth = await requireAuth(req, res);
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    if (auth.type !== 'shop') {
      return sendError(res, 'Shop account required', 403);
    }

    const shopId = auth.user?.id;
    const body = req.body || {};

    // Load websites database
    const websitesDb = await readDatabase('websites.json');
    const websites = websitesDb.websites || [];

    // Find existing website or create new
    let websiteIndex = websites.findIndex(w => w.shopId === shopId);
    let website;

    if (websiteIndex >= 0) {
      website = websites[websiteIndex];
    } else {
      website = {
        id: `web_${Date.now()}`,
        shopId,
        createdAt: new Date().toISOString(),
        published: false,
        sections: DEFAULT_SECTIONS
      };
      websites.push(website);
      websiteIndex = websites.length - 1;
    }

    // Update website configuration
    if (body.theme && THEMES[body.theme]) {
      website.theme = body.theme;
      website.themeConfig = THEMES[body.theme];
    }

    if (body.businessInfo) {
      website.businessInfo = {
        ...website.businessInfo,
        ...body.businessInfo
      };
    }

    if (body.sections) {
      website.sections = body.sections;
    }

    if (body.content) {
      website.content = {
        ...website.content,
        ...body.content
      };
    }

    if (body.seo) {
      website.seo = {
        ...website.seo,
        ...body.seo
      };
    }

    if (body.customDomain !== undefined) {
      website.customDomain = body.customDomain;
    }

    website.updatedAt = new Date().toISOString();

    // Save back
    websites[websiteIndex] = website;
    websitesDb.websites = websites;
    websitesDb.updatedAt = new Date().toISOString();
    await writeDatabase('websites.json', websitesDb);

    return sendSuccess(res, {
      message: 'Website saved',
      website: {
        id: website.id,
        theme: website.theme,
        published: website.published,
        sections: website.sections,
        updatedAt: website.updatedAt
      },
      availableThemes: Object.keys(THEMES).map(key => ({
        id: key,
        ...THEMES[key]
      }))
    });

  } catch (err) {
    console.error('Website save error:', err.message);
    return sendError(res, 'Failed to save website', 500);
  }
};

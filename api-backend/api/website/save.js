/**
 * POST /api/website/save
 * Save shop website configuration
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase, sanitizeInput } = require('../../lib/utils');
const { requireAuth, updateShop } = require('../../lib/auth');

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
      return sendError(res, 'Only shop accounts can create websites', 403);
    }

    // Check if shop has website access
    const plan = auth.shop.subscriptionPlan;
    if (!['pro', 'enterprise'].includes(plan)) {
      return sendError(res, 'Website builder requires Pro or Enterprise plan', 403);
    }

    const body = req.body || {};
    const shopId = auth.shop.id;

    // Load websites database
    const websitesDb = await readDatabase('websites.json');
    const websites = websitesDb.websites || {};

    // Website configuration
    const websiteConfig = {
      shopId,
      shopName: auth.shop.shopName,
      theme: body.theme || 'lavender',
      customDomain: body.customDomain || null,
      sections: body.sections || [
        { type: 'hero', enabled: true },
        { type: 'about', enabled: true },
        { type: 'services', enabled: true },
        { type: 'prices', enabled: true },
        { type: 'contact', enabled: true }
      ],
      content: {
        heroTitle: sanitizeInput(body.heroTitle || auth.shop.shopName),
        heroSubtitle: sanitizeInput(body.heroSubtitle || 'Professional Device Repair Services'),
        aboutText: sanitizeInput(body.aboutText || ''),
        services: body.services || [],
        prices: body.prices || [],
        contactInfo: {
          phone: auth.shop.phone,
          email: auth.shop.email,
          address: auth.shop.address
        }
      },
      seo: {
        title: sanitizeInput(body.seoTitle || `${auth.shop.shopName} - Device Repair`),
        description: sanitizeInput(body.seoDescription || ''),
        keywords: body.keywords || []
      },
      colors: body.colors || {
        primary: '#a78bfa',
        secondary: '#06b6d4',
        background: '#0a0a0f',
        text: '#ffffff'
      },
      fonts: body.fonts || {
        heading: 'Space Grotesk',
        body: 'Inter'
      },
      published: websites[shopId]?.published || false,
      createdAt: websites[shopId]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    websites[shopId] = websiteConfig;
    websitesDb.websites = websites;
    websitesDb.updatedAt = new Date().toISOString();
    await writeDatabase('websites.json', websitesDb);

    // Generate website slug if not exists
    if (!auth.shop.websiteSlug) {
      const slug = auth.shop.shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await updateShop(shopId, { websiteSlug: slug, websiteEnabled: true });
    }

    console.log(`Website saved for shop: ${auth.shop.shopName}`);

    return sendSuccess(res, {
      message: 'Website configuration saved',
      website: websiteConfig,
      previewUrl: `https://fixologyai.com/shop/${auth.shop.websiteSlug || shopId}`
    });

  } catch (err) {
    console.error('Website save error:', err.message);
    return sendError(res, 'Failed to save website', 500);
  }
};


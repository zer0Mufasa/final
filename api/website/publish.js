/**
 * POST /api/website/publish
 * Publish or unpublish a shop website
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../lib/utils');
const { requireAuth, updateShop } = require('../lib/auth');

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
    const { publish } = req.body || {};

    // Load websites database
    const websitesDb = await readDatabase('websites.json');
    const websites = websitesDb.websites || [];

    const websiteIndex = websites.findIndex(w => w.shopId === shopId);

    if (websiteIndex < 0) {
      return sendError(res, 'No website found. Please save your website first.', 404);
    }

    const website = websites[websiteIndex];

    // Validate website has required content before publishing
    if (publish) {
      if (!website.businessInfo?.name) {
        return sendError(res, 'Business name is required to publish', 400);
      }
      if (!website.theme) {
        return sendError(res, 'Please select a theme before publishing', 400);
      }
    }

    // Update publish status
    website.published = publish !== false;
    website.publishedAt = publish ? new Date().toISOString() : null;
    website.updatedAt = new Date().toISOString();

    // Generate public URL
    const slug = website.businessInfo?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || shopId;
    
    website.publicUrl = `https://fixologyai.com/shop/${slug}`;

    // Update shop record
    await updateShop(shopId, {
      websiteEnabled: website.published,
      websiteUrl: website.publicUrl
    });

    // Save back
    websites[websiteIndex] = website;
    websitesDb.websites = websites;
    websitesDb.updatedAt = new Date().toISOString();
    await writeDatabase('websites.json', websitesDb);

    return sendSuccess(res, {
      message: website.published ? 'Website published!' : 'Website unpublished',
      published: website.published,
      publicUrl: website.published ? website.publicUrl : null,
      publishedAt: website.publishedAt
    });

  } catch (err) {
    console.error('Website publish error:', err.message);
    return sendError(res, 'Failed to publish website', 500);
  }
};

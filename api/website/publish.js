/**
 * POST /api/website/publish
 * Publish shop website
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
      return sendError(res, 'Only shop accounts can publish websites', 403);
    }

    const plan = auth.shop.subscriptionPlan;
    if (!['pro', 'enterprise'].includes(plan)) {
      return sendError(res, 'Website publishing requires Pro or Enterprise plan', 403);
    }

    const shopId = auth.shop.id;
    const body = req.body || {};
    const action = body.action || 'publish'; // 'publish' or 'unpublish'

    // Load websites database
    const websitesDb = await readDatabase('websites.json');
    const websites = websitesDb.websites || {};

    if (!websites[shopId]) {
      return sendError(res, 'No website configuration found. Please save your website first.', 404);
    }

    websites[shopId].published = action === 'publish';
    websites[shopId].publishedAt = action === 'publish' ? new Date().toISOString() : null;
    websites[shopId].updatedAt = new Date().toISOString();

    websitesDb.websites = websites;
    websitesDb.updatedAt = new Date().toISOString();
    await writeDatabase('websites.json', websitesDb);

    // Update shop record
    await updateShop(shopId, { websiteEnabled: action === 'publish' });

    const slug = auth.shop.websiteSlug || shopId;
    const liveUrl = `https://fixologyai.com/shop/${slug}`;

    console.log(`Website ${action}ed for shop: ${auth.shop.shopName}`);

    return sendSuccess(res, {
      message: action === 'publish' ? 'Website published successfully!' : 'Website unpublished',
      published: action === 'publish',
      liveUrl: action === 'publish' ? liveUrl : null
    });

  } catch (err) {
    console.error('Website publish error:', err.message);
    return sendError(res, 'Failed to publish website', 500);
  }
};


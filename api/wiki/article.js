/**
 * GET /api/wiki/article
 * Get a specific wiki article by ID
 */

const { handleCors, sendSuccess, sendError, readDatabase } = require('../lib/utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const articleId = parseInt(req.query?.id);
    
    if (!articleId) {
      return sendError(res, 'Article ID is required', 400);
    }

    const wikiDb = await readDatabase('wiki.json');
    const articles = wikiDb.articles || [];

    const article = articles.find(a => a.id === articleId);

    if (!article) {
      return sendError(res, 'Article not found', 404);
    }

    // Get related articles (same category or overlapping tags)
    const related = articles
      .filter(a => a.id !== articleId && (
        a.category === article.category ||
        a.tags?.some(t => article.tags?.includes(t))
      ))
      .slice(0, 5);

    return sendSuccess(res, {
      article,
      related
    });

  } catch (err) {
    console.error('Wiki article error:', err.message);
    return sendError(res, 'Failed to get article', 500);
  }
};

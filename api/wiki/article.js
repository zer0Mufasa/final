/**
 * GET /api/wiki/article?id=xxx
 * Get single wiki article
 */

const { handleCors, sendSuccess, sendError, readDatabase, writeDatabase } = require('../../lib/utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const articleId = req.query?.id;

    if (!articleId) {
      return sendError(res, 'Article ID is required', 400);
    }

    const wikiData = await readDatabase('wiki.json');
    const articles = wikiData.articles || [];

    const article = articles.find(a => a.id === articleId);

    if (!article) {
      return sendError(res, 'Article not found', 404);
    }

    // Increment view count
    article.views = (article.views || 0) + 1;
    await writeDatabase('wiki.json', wikiData);

    // Get related articles
    const related = articles
      .filter(a => 
        a.id !== articleId && 
        (a.category === article.category || article.relatedArticles?.includes(a.id))
      )
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        title: a.title,
        category: a.category
      }));

    return sendSuccess(res, {
      article: {
        ...article,
        related
      }
    });

  } catch (err) {
    console.error('Wiki article error:', err.message);
    return sendError(res, 'Failed to retrieve article', 500);
  }
};


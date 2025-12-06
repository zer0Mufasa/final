/**
 * GET /api/wiki/search
 * Search repair wiki articles
 */

const { handleCors, sendSuccess, sendError, readDatabase } = require('../../lib/utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const query = (req.query?.q || '').toLowerCase().trim();
    const category = req.query?.category || '';
    const limit = parseInt(req.query?.limit) || 20;

    const wikiData = await readDatabase('wiki.json');
    let articles = wikiData.articles || [];

    // Filter by category if specified
    if (category) {
      articles = articles.filter(a => 
        a.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search if query provided
    if (query) {
      articles = articles.filter(a => {
        const searchText = [
          a.title,
          a.content,
          a.category,
          a.subcategory,
          ...(a.steps || []),
          ...(a.tools || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(query);
      });

      // Sort by relevance (title match first)
      articles.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(query) ? 1 : 0;
        const bTitle = b.title.toLowerCase().includes(query) ? 1 : 0;
        if (aTitle !== bTitle) return bTitle - aTitle;
        return b.views - a.views; // Then by popularity
      });
    } else {
      // Sort by popularity if no search query
      articles.sort((a, b) => b.views - a.views);
    }

    // Limit results
    const results = articles.slice(0, limit);

    return sendSuccess(res, {
      query,
      category: category || 'all',
      total: articles.length,
      results: results.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        subcategory: a.subcategory,
        difficulty: a.difficulty,
        timeEstimate: a.timeEstimate,
        views: a.views,
        helpful: a.helpful,
        excerpt: a.content.substring(0, 200) + '...'
      })),
      categories: wikiData.categories || []
    });

  } catch (err) {
    console.error('Wiki search error:', err.message);
    return sendError(res, 'Failed to search wiki', 500);
  }
};


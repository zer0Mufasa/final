/**
 * GET /api/admin/stats
 * Admin dashboard statistics
 */

const { handleCors, sendSuccess, sendError, readDatabase } = require('../lib/utils');
const { requireAdmin, getAllUsers, getAllShops } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    // For now, allow stats without admin auth for testing
    // In production, uncomment the auth check below
    /*
    const auth = await requireAdmin(req, res);
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }
    */

    // Load all data from Redis
    const [users, shops, imeiLogs, diagnosticsLogs, memoryData] = await Promise.all([
      getAllUsers().catch(() => []),
      getAllShops().catch(() => []),
      readDatabase('imei-log.json').catch(() => []),
      readDatabase('diagnostics-log.json').catch(() => []),
      readDatabase('memory.json').catch(() => ({ conversations: {} }))
    ]);

    const imeiChecks = Array.isArray(imeiLogs) ? imeiLogs : [];
    const diagnostics = Array.isArray(diagnosticsLogs) ? diagnosticsLogs : [];
    const conversations = memoryData?.conversations || {};

    // Calculate time-based stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User stats
    const usersToday = users.filter(u => new Date(u.createdAt) >= today).length;
    const usersThisWeek = users.filter(u => new Date(u.createdAt) >= thisWeek).length;
    const usersThisMonth = users.filter(u => new Date(u.createdAt) >= thisMonth).length;

    // Shop stats
    const shopsToday = shops.filter(s => new Date(s.createdAt) >= today).length;
    const activeShops24h = shops.filter(s => {
      const updated = new Date(s.updatedAt || s.createdAt);
      return (now - updated) < 24 * 60 * 60 * 1000;
    }).length;

    // Subscription breakdown
    const subscriptionStats = {
      free: shops.filter(s => s.subscriptionPlan === 'free' || !s.subscriptionPlan).length,
      basic: shops.filter(s => s.subscriptionPlan === 'basic').length,
      pro: shops.filter(s => s.subscriptionPlan === 'pro').length,
      enterprise: shops.filter(s => s.subscriptionPlan === 'enterprise').length
    };

    // IMEI check stats
    const imeiToday = imeiChecks.filter(c => new Date(c.timestamp) >= today).length;
    const imeiThisWeek = imeiChecks.filter(c => new Date(c.timestamp) >= thisWeek).length;
    const imeiThisMonth = imeiChecks.filter(c => new Date(c.timestamp) >= thisMonth).length;

    // Diagnostics stats
    const diagToday = diagnostics.filter(d => new Date(d.timestamp) >= today).length;
    const diagThisWeek = diagnostics.filter(d => new Date(d.timestamp) >= thisWeek).length;

    // Device popularity (from diagnostics)
    const deviceCounts = {};
    diagnostics.forEach(d => {
      const device = d.device || 'Unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    const topDevices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([device, count]) => ({ device, count }));

    // City popularity
    const cityCounts = {};
    [...users, ...shops].forEach(u => {
      const city = u.city || 'Unknown';
      if (city && city !== 'Unknown') {
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      }
    });
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    // Revenue calculation (estimated)
    const monthlyRevenue = {
      basic: subscriptionStats.basic * 29,
      pro: subscriptionStats.pro * 79,
      enterprise: subscriptionStats.enterprise * 199,
      total: (subscriptionStats.basic * 29) + (subscriptionStats.pro * 79) + (subscriptionStats.enterprise * 199)
    };

    // Daily volume for charts (last 7 days)
    const dailyVolume = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      dailyVolume.push({
        date: date.toISOString().split('T')[0],
        imei: imeiChecks.filter(c => {
          const t = new Date(c.timestamp);
          return t >= date && t < nextDate;
        }).length,
        diagnostics: diagnostics.filter(d => {
          const t = new Date(d.timestamp);
          return t >= date && t < nextDate;
        }).length,
        users: users.filter(u => {
          const t = new Date(u.createdAt);
          return t >= date && t < nextDate;
        }).length
      });
    }

    return sendSuccess(res, {
      overview: {
        totalUsers: users.length,
        totalShops: shops.length,
        totalImeiChecks: imeiChecks.length,
        totalDiagnostics: diagnostics.length,
        activeConversations: Object.keys(conversations).length
      },
      users: {
        total: users.length,
        today: usersToday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth
      },
      shops: {
        total: shops.length,
        today: shopsToday,
        activeLastDay: activeShops24h,
        verified: shops.filter(s => s.verified).length,
        subscriptions: subscriptionStats
      },
      imei: {
        total: imeiChecks.length,
        today: imeiToday,
        thisWeek: imeiThisWeek,
        thisMonth: imeiThisMonth
      },
      diagnostics: {
        total: diagnostics.length,
        today: diagToday,
        thisWeek: diagThisWeek,
        topDevices
      },
      locations: {
        topCities
      },
      revenue: monthlyRevenue,
      dailyVolume,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Admin stats error:', err.message);
    return sendError(res, 'Failed to retrieve stats', 500);
  }
};

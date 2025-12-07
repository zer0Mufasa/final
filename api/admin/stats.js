/**
 * GET /api/admin/stats
 * Admin dashboard statistics - pulls real data from Redis
 * Falls back to showing current registered users/shops
 */

const { handleCors, sendSuccess, sendError } = require('../lib/utils');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    let users = [];
    let shops = [];
    let imeiChecks = [];
    let diagnostics = [];

    // Try to load from Redis
    try {
      const { getAllUsers, getAllShops, getRedis } = require('../lib/auth');
      
      [users, shops] = await Promise.all([
        getAllUsers().catch(() => []),
        getAllShops().catch(() => [])
      ]);

      // Try to get logs
      const redis = getRedis();
      if (redis) {
        try {
          const imeiLogsRaw = await redis.lrange('imei_logs', 0, -1);
          imeiChecks = (imeiLogsRaw || []).map(log => {
            try {
              return typeof log === 'string' ? JSON.parse(log) : log;
            } catch {
              return null;
            }
          }).filter(Boolean);
        } catch (e) {
          console.log('No IMEI logs:', e.message);
        }
        
        try {
          const diagLogsRaw = await redis.lrange('diagnostics_logs', 0, -1);
          diagnostics = (diagLogsRaw || []).map(log => {
            try {
              return typeof log === 'string' ? JSON.parse(log) : log;
            } catch {
              return null;
            }
          }).filter(Boolean);
        } catch (e) {
          console.log('No diagnostics logs:', e.message);
        }
      }
    } catch (redisError) {
      console.log('Redis not available:', redisError.message);
      // Continue with empty arrays
    }

    // Calculate time-based stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User stats
    const usersToday = users.filter(u => u.createdAt && new Date(u.createdAt) >= today).length;
    const usersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) >= thisWeek).length;
    const usersThisMonth = users.filter(u => u.createdAt && new Date(u.createdAt) >= thisMonth).length;

    // Shop stats
    const shopsToday = shops.filter(s => s.createdAt && new Date(s.createdAt) >= today).length;
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
    const imeiToday = imeiChecks.filter(c => c.timestamp && new Date(c.timestamp) >= today).length;
    const imeiThisWeek = imeiChecks.filter(c => c.timestamp && new Date(c.timestamp) >= thisWeek).length;
    const imeiThisMonth = imeiChecks.filter(c => c.timestamp && new Date(c.timestamp) >= thisMonth).length;

    // Diagnostics stats
    const diagToday = diagnostics.filter(d => d.timestamp && new Date(d.timestamp) >= today).length;
    const diagThisWeek = diagnostics.filter(d => d.timestamp && new Date(d.timestamp) >= thisWeek).length;

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

    // Revenue calculation
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
          if (!c.timestamp) return false;
          const t = new Date(c.timestamp);
          return t >= date && t < nextDate;
        }).length,
        diagnostics: diagnostics.filter(d => {
          if (!d.timestamp) return false;
          const t = new Date(d.timestamp);
          return t >= date && t < nextDate;
        }).length,
        users: users.filter(u => {
          if (!u.createdAt) return false;
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
        totalDiagnostics: diagnostics.length
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
      usersList: users.slice(0, 50),
      shopsList: shops.slice(0, 50),
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Admin stats error:', err.message);
    
    // Return minimal stats on error so the page doesn't break
    return sendSuccess(res, {
      overview: {
        totalUsers: 0,
        totalShops: 0,
        totalImeiChecks: 0,
        totalDiagnostics: 0
      },
      users: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      shops: { total: 0, today: 0, activeLastDay: 0, verified: 0, subscriptions: { free: 0, basic: 0, pro: 0, enterprise: 0 } },
      imei: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      diagnostics: { total: 0, today: 0, thisWeek: 0, topDevices: [] },
      locations: { topCities: [] },
      revenue: { basic: 0, pro: 0, enterprise: 0, total: 0 },
      dailyVolume: [],
      usersList: [],
      shopsList: [],
      generatedAt: new Date().toISOString(),
      error: err.message
    });
  }
};

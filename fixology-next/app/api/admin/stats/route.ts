import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

function planPriceDollars(plan: string) {
  switch (plan) {
    case 'STARTER':
      return 29
    case 'PRO':
      return 79
    case 'ENTERPRISE':
      return 199
    default:
      return 0
  }
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const [totalShops, activeShops, trialShops, suspendedShops, cancelledShops, totalUsers, newShopsThisMonth, newShopsThisWeek] =
    await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'ACTIVE' } }),
      prisma.shop.count({ where: { status: 'TRIAL' } }),
      prisma.shop.count({ where: { status: 'SUSPENDED' } }),
      prisma.shop.count({ where: { status: 'CANCELLED' } }),
      prisma.shopUser.count(),
      prisma.shop.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.shop.count({ where: { createdAt: { gte: weekStart } } }),
    ])

  // MRR estimate (plan pricing) for active + trial shops (exclude cancelled)
  const shopsForMrr = await prisma.shop.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] } },
    select: { plan: true, createdAt: true },
  })
  const mrr = shopsForMrr.reduce((sum, s) => sum + planPriceDollars(s.plan), 0)

  // Very rough "last month MRR": shops created before current month start
  const lastMonthMrr = shopsForMrr
    .filter((s) => s.createdAt <= lastMonthEnd)
    .reduce((sum, s) => sum + planPriceDollars(s.plan), 0)
  const mrrChangePct = lastMonthMrr > 0 ? Math.round(((mrr - lastMonthMrr) / lastMonthMrr) * 1000) / 10 : null

  // Active users (approx): users who logged in within the last 1/7 days
  const dayStart = new Date(now)
  dayStart.setDate(now.getDate() - 1)
  const [activeUsersToday, activeUsersThisWeek] = await Promise.all([
    prisma.shopUser.count({ where: { lastLoginAt: { gte: dayStart } } }),
    prisma.shopUser.count({ where: { lastLoginAt: { gte: weekStart } } }),
  ])

  return NextResponse.json({
    shops: {
      total: totalShops,
      active: activeShops,
      trial: trialShops,
      suspended: suspendedShops,
      cancelled: cancelledShops,
      newThisMonth: newShopsThisMonth,
      newThisWeek: newShopsThisWeek,
    },
    users: {
      total: totalUsers,
      activeToday: activeUsersToday,
      activeThisWeek: activeUsersThisWeek,
    },
    revenue: {
      mrr,
      arr: mrr * 12,
      mrrChangePct,
      // Not yet tracked in this codebase (Stripe subscription history needed)
      churnRatePct: null,
      nrrPct: null,
      arpu: null,
      ltv: null,
      cac: null,
      trialToPaidConversionPct: null,
    },
    system: {
      status: 'healthy',
    },
  })
}


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
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const shops = await prisma.shop.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] } },
    select: { id: true, plan: true, createdAt: true },
  })

  const mrr = shops.reduce((sum, s) => sum + planPriceDollars(s.plan), 0)
  const arr = mrr * 12

  const lastMonthMrr = shops
    .filter((s) => s.createdAt <= lastMonthEnd)
    .reduce((sum, s) => sum + planPriceDollars(s.plan), 0)

  const netNewMrr = mrr - lastMonthMrr
  const mrrChangePct = lastMonthMrr > 0 ? Math.round(((mrr - lastMonthMrr) / lastMonthMrr) * 1000) / 10 : null

  // Revenue last 30 days from POS payments (invoices/payments)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const invoices = await prisma.invoice.findMany({
    where: { paidAt: { gte: thirtyDaysAgo }, status: { in: ['PAID', 'PARTIAL'] } },
    select: { amountPaid: true },
  })
  const revenue30d = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0)

  const activeShopCount = await prisma.shop.count({ where: { status: 'ACTIVE' } })
  const arpu = activeShopCount > 0 ? Math.round((mrr / activeShopCount) * 100) / 100 : null

  return NextResponse.json({
    revenue: {
      mrr,
      arr,
      mrrChangePct,
      netNewMrr,
      revenue30d,
      // Advanced SaaS metrics need subscription + acquisition tracking
      ltv: null,
      cac: null,
      arpu,
      churnedMrr: null,
      expansionMrr: null,
      contractionMrr: null,
    },
    periods: {
      monthStart: monthStart.toISOString(),
      lastMonthStart: lastMonthStart.toISOString(),
      lastMonthEnd: lastMonthEnd.toISOString(),
      thirtyDaysAgo: thirtyDaysAgo.toISOString(),
    },
  })
}


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

function monthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const shops = await prisma.shop.findMany({
    select: { id: true, plan: true, status: true, createdAt: true, updatedAt: true },
  })

  const points: Array<{
    month: string
    mrr: number
    newMrr: number
    churnedMrr: number
    signups: number
  }> = []

  for (let i = 0; i < 12; i++) {
    const ms = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const me = new Date(start.getFullYear(), start.getMonth() + i + 1, 1)
    const key = monthKey(ms)

    const signups = shops.filter((s) => s.createdAt >= ms && s.createdAt < me).length
    const newMrr = shops
      .filter((s) => s.createdAt >= ms && s.createdAt < me)
      .reduce((sum, s) => sum + planPriceDollars(s.plan), 0)

    // Approx churn month: CANCELLED shops updated in month
    const churnedMrr = shops
      .filter((s) => s.status === 'CANCELLED' && s.updatedAt >= ms && s.updatedAt < me)
      .reduce((sum, s) => sum + planPriceDollars(s.plan), 0)

    // Approx "MRR at end of month": shops created before month end and not cancelled
    const mrr = shops
      .filter((s) => s.createdAt < me && s.status !== 'CANCELLED')
      .reduce((sum, s) => sum + planPriceDollars(s.plan), 0)

    points.push({ month: key, mrr, newMrr, churnedMrr, signups })
  }

  const last = points[points.length - 1]?.mrr ?? 0
  const prev = points[points.length - 2]?.mrr ?? 0
  const mrrChangePct = prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : null

  return NextResponse.json({ points, mrrChangePct })
}


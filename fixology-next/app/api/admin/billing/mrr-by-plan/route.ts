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

  const shops = await prisma.shop.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] } },
    select: { plan: true },
  })

  const byPlan: Record<string, { plan: string; shops: number; mrr: number }> = {}
  for (const s of shops) {
    const p = s.plan
    if (!byPlan[p]) byPlan[p] = { plan: p, shops: 0, mrr: 0 }
    byPlan[p].shops += 1
    byPlan[p].mrr += planPriceDollars(p)
  }

  const rows = Object.values(byPlan).sort((a, b) => b.mrr - a.mrr)
  const totalMrr = rows.reduce((sum, r) => sum + r.mrr, 0)

  return NextResponse.json({
    totalMrr,
    rows: rows.map((r) => ({ ...r, percent: totalMrr > 0 ? Math.round((r.mrr / totalMrr) * 1000) / 10 : 0 })),
  })
}


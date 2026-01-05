import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function healthScoreFrom(lastActiveAt: Date | null, status: string) {
  // Simple Phase-1 heuristic (replace with real health-score model later):
  // - recent activity drives score
  // - suspended/cancelled heavily penalized
  if (status === 'CANCELLED') return 0
  if (status === 'SUSPENDED') return 10
  if (!lastActiveAt) return 25
  const days = Math.floor((Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
  const score = 100 - days * 3
  return clamp(score, 0, 100)
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const days = Math.max(1, Number(searchParams.get('days') || 14))
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 25)))

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const shops = await prisma.shop.findMany({
    where: { status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] } },
    select: { id: true, name: true, slug: true, status: true, plan: true, trialEndsAt: true, createdAt: true },
    take: 500,
    orderBy: { createdAt: 'desc' },
  })

  const shopIds = shops.map((s) => s.id)
  const lastLogins = await prisma.shopUser.groupBy({
    by: ['shopId'],
    where: { shopId: { in: shopIds }, lastLoginAt: { not: null } },
    _max: { lastLoginAt: true },
  })

  const lastLoginMap = new Map<string, Date>()
  for (const row of lastLogins) {
    const d = row._max.lastLoginAt
    if (d) lastLoginMap.set(row.shopId, d)
  }

  const now = new Date()
  const expiringTrials = shops
    .filter((s) => s.status === 'TRIAL' && s.trialEndsAt && s.trialEndsAt.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      plan: s.plan,
      status: s.status,
      trialEndsAt: s.trialEndsAt?.toISOString() || null,
    }))

  const atRisk = shops
    .map((s) => {
      const lastActiveAt = lastLoginMap.get(s.id) || null
      const score = healthScoreFrom(lastActiveAt, s.status)
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        plan: s.plan,
        lastActiveAt: lastActiveAt?.toISOString() || null,
        healthScore: score,
        reason: !lastActiveAt
          ? 'No login recorded'
          : lastActiveAt < cutoff
            ? `No login in ${days}+ days`
            : s.status === 'PAST_DUE'
              ? 'Past due'
              : s.status === 'SUSPENDED'
                ? 'Suspended'
                : 'Low activity',
      }
    })
    .filter((s) => s.healthScore <= 55 || (s.lastActiveAt ? new Date(s.lastActiveAt) < cutoff : true) || s.status === 'PAST_DUE')
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, limit)

  return NextResponse.json({ atRisk, expiringTrials, cutoff: cutoff.toISOString() })
}


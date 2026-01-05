import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get email broadcast stats
  const broadcasts = await prisma.emailBroadcast.findMany({
    where: {
      createdAt: { gte: today },
      status: 'sent',
    },
    select: {
      stats: true,
    },
  })

  let sentToday = 0
  let opens = 0
  let clicks = 0
  let bounces = 0

  broadcasts.forEach((broadcast) => {
    const stats = broadcast.stats as any
    if (stats) {
      sentToday += stats.sent || 0
      opens += stats.opens || 0
      clicks += stats.clicks || 0
      bounces += stats.bounces || 0
    }
  })

  const openRate = sentToday > 0 ? (opens / sentToday) * 100 : 0
  const clickRate = sentToday > 0 ? (clicks / sentToday) * 100 : 0
  const bounceRate = sentToday > 0 ? (bounces / sentToday) * 100 : 0

  return NextResponse.json({
    sentToday,
    openRate,
    clickRate,
    bounceRate,
  })
}

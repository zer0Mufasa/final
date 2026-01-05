import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const activeAlerts = await prisma.alert.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    include: {
      rule: { select: { id: true, name: true } },
    },
    take: 20,
  })

  return NextResponse.json({
    alerts: activeAlerts.map((alert) => ({
      id: alert.id,
      ruleId: alert.ruleId,
      rule: alert.rule,
      status: alert.status,
      message: alert.message,
      data: alert.data,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt?.toISOString() || null,
      resolvedBy: alert.resolvedBy,
      resolvedAt: alert.resolvedAt?.toISOString() || null,
      snoozedUntil: alert.snoozedUntil?.toISOString() || null,
      createdAt: alert.createdAt.toISOString(),
    })),
  })
}

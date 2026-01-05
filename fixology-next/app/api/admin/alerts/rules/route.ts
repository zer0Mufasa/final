import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rules = await prisma.alertRule.findMany({
    include: { _count: { select: { alerts: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ rules })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'alert.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { name, condition, channels, recipients, cooldownMinutes } = body || {}

  if (!name || !condition || !channels || !recipients) {
    return NextResponse.json({ error: 'name, condition, channels, and recipients are required' }, { status: 400 })
  }

  const rule = await prisma.alertRule.create({
    data: {
      name,
      condition,
      channels,
      recipients,
      cooldownMinutes: cooldownMinutes || 60,
      createdById: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'alert.create',
    'alert_rule',
    rule.id,
    `Created alert rule: ${rule.name}`,
    { name },
    request
  )

  return NextResponse.json({ rule }, { status: 201 })
}

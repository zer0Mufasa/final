import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { deliveries: true } },
    },
  })

  return NextResponse.json({ webhooks })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'webhook.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { url, events, secret } = body || {}

  if (!url || !events || !Array.isArray(events)) {
    return NextResponse.json({ error: 'url and events array are required' }, { status: 400 })
  }

  const webhook = await prisma.webhook.create({
    data: {
      url,
      events,
      secret,
    },
  })

  await logAdminAction(
    admin,
    'webhook.create',
    'webhook',
    webhook.id,
    `Created webhook: ${webhook.url}`,
    { url, events },
    request
  )

  return NextResponse.json({ webhook }, { status: 201 })
}

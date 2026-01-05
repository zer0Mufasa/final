import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'email.broadcast')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { subject, content, recipientType, recipientIds, segmentId, scheduledAt } = body || {}

  if (!subject || !content || !recipientType) {
    return NextResponse.json({ error: 'subject, content, and recipientType are required' }, { status: 400 })
  }

  const broadcast = await prisma.emailBroadcast.create({
    data: {
      subject,
      content,
      recipientType,
      recipientIds: recipientIds || [],
      segmentId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      createdById: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'email.broadcast',
    'email_broadcast',
    broadcast.id,
    `Created email broadcast: ${broadcast.subject}`,
    { subject, recipientType },
    request
  )

  return NextResponse.json({ broadcast }, { status: 201 })
}

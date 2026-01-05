import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'webhook.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { isActive, url, events } = body || {}

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  const updated = await prisma.webhook.update({
    where: { id: params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(url && { url }),
      ...(events && { events }),
    },
  })

  await logAdminAction(
    admin,
    'webhook.update',
    'webhook',
    updated.id,
    `Updated webhook: ${updated.url}`,
    { isActive, url, events },
    request
  )

  return NextResponse.json({ webhook: updated })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'webhook.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  await prisma.webhook.delete({ where: { id: params.id } })

  await logAdminAction(
    admin,
    'webhook.delete',
    'webhook',
    webhook.id,
    `Deleted webhook: ${webhook.url}`,
    {},
    request
  )

  return NextResponse.json({ success: true })
}

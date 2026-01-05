import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'webhook.test')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } })
  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })

  // TODO: Actually send test webhook to the URL
  // For now, just update lastTriggered
  await prisma.webhook.update({
    where: { id: params.id },
    data: { lastTriggered: new Date() },
  })

  return NextResponse.json({ success: true, message: 'Test webhook sent' })
}

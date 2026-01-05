import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'announcement.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const isActive = body?.isActive !== undefined ? body.isActive : true

  const announcement = await prisma.announcement.findUnique({ where: { id: params.id } })
  if (!announcement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

  const updated = await prisma.announcement.update({
    where: { id: params.id },
    data: { isActive },
  })

  await logAdminAction(
    admin,
    'announcement.activate',
    'announcement',
    updated.id,
    `${isActive ? 'Activated' : 'Deactivated'} announcement: ${updated.title}`,
    { isActive },
    request
  )

  return NextResponse.json({ success: true, announcement: updated })
}

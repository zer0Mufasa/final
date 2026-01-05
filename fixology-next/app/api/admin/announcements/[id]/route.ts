import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
  })

  if (!announcement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

  return NextResponse.json({ announcement })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'announcement.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const data: any = {}
  if (typeof body?.title === 'string') data.title = body.title.trim()
  if (typeof body?.content === 'string') data.content = body.content.trim()
  if (typeof body?.type === 'string') data.type = body.type
  if (typeof body?.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body?.targetAudience === 'string') data.targetAudience = body.targetAudience
  if (body?.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

  const oldAnnouncement = await prisma.announcement.findUnique({ where: { id: params.id } })
  if (!oldAnnouncement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

  const announcement = await prisma.announcement.update({
    where: { id: params.id },
    data,
  })

  await logAdminAction(
    admin,
    'announcement.update',
    'announcement',
    announcement.id,
    `Updated announcement: ${announcement.title}`,
    { oldData: oldAnnouncement, newData: data },
    request
  )

  return NextResponse.json({ announcement })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'announcement.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const announcement = await prisma.announcement.findUnique({ where: { id: params.id } })
  if (!announcement) return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })

  await prisma.announcement.delete({
    where: { id: params.id },
  })

  await logAdminAction(
    admin,
    'announcement.delete',
    'announcement',
    announcement.id,
    `Deleted announcement: ${announcement.title}`,
    {},
    request
  )

  return NextResponse.json({ success: true })
}

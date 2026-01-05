import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'user.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const user = await prisma.shopUser.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  const updated = await prisma.shopUser.update({
    where: { id: params.id },
    data: { status: newStatus },
  })

  await logAdminAction(
    admin,
    'user.toggle_status',
    'user',
    updated.id,
    `User ${updated.email} status changed to ${newStatus}`,
    { oldStatus: user.status, newStatus },
    request
  )

  return NextResponse.json({ success: true, user: updated })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'shop_tag.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const tag = await prisma.shopTag.findUnique({ where: { id: params.id } })
  if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 })

  await prisma.shopTag.delete({ where: { id: params.id } })

  await logAdminAction(
    admin,
    'shop_tag.delete',
    'shop_tag',
    tag.id,
    `Deleted shop tag: ${tag.name}`,
    { tagId: tag.id, name: tag.name },
    request
  )

  return NextResponse.json({ success: true })
}

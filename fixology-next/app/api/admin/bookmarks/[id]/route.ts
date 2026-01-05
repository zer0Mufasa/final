import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookmark = await prisma.adminBookmark.findUnique({ where: { id: params.id } })
  if (!bookmark) return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })

  // Verify ownership
  if (bookmark.adminId !== admin.id) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  await prisma.adminBookmark.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

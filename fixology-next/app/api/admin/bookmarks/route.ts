import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookmarks = await prisma.adminBookmark.findMany({
    where: { adminId: admin.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ bookmarks })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetType, targetId, label } = await request.json()

  const bookmark = await prisma.adminBookmark.create({
    data: {
      adminId: admin.id,
      targetType,
      targetId,
      label,
    },
  })

  return NextResponse.json({ bookmark })
}

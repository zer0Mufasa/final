import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tags = await prisma.shopTag.findMany({
    include: { _count: { select: { shops: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tags })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'tag.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { name, color } = body || {}

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const tag = await prisma.shopTag.create({
    data: {
      name,
      color: color || '#8884d8',
    },
  })

  await logAdminAction(
    admin,
    'tag.create',
    'tag',
    tag.id,
    `Created shop tag: ${tag.name}`,
    { name, color },
    request
  )

  return NextResponse.json({ tag }, { status: 201 })
}

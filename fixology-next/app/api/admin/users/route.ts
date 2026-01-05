import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const shopId = (searchParams.get('shopId') || '').trim()
  const role = (searchParams.get('role') || '').trim()
  const status = (searchParams.get('status') || '').trim()
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 25)))
  const orderBy = searchParams.get('orderBy') || 'createdAt'
  const orderDir = searchParams.get('orderDir') === 'asc' ? 'asc' : 'desc'

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (shopId) where.shopId = shopId
  if (role) where.role = role
  if (status) where.status = status

  const [users, totalCount] = await prisma.$transaction([
    prisma.shopUser.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      include: {
        shop: { select: { id: true, name: true, slug: true } },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.shopUser.count({ where }),
  ])

  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
    shop: user.shop,
  }))

  return NextResponse.json({ users: formattedUsers, totalCount })
}

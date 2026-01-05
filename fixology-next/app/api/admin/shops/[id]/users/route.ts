import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.shopUser.findMany({
    where: { shopId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, phone: true, status: true, lastLoginAt: true, createdAt: true },
  })

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
    })),
  })
}


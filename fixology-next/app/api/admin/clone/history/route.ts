import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 25)))

  const [history, totalCount] = await prisma.$transaction([
    prisma.cloneHistory.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { name: true, email: true } },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.cloneHistory.count(),
  ])

  return NextResponse.json({ history, totalCount })
}

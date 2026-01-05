import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const surveys = await prisma.customSurvey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { responses: true } },
    },
  })

  return NextResponse.json({ surveys })
}

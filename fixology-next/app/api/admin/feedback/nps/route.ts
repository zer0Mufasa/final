import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') // promoters, passives, detractors

  let where: any = {}
  if (filter === 'promoters') where.score = { gte: 9 }
  else if (filter === 'passives') where.score = { gte: 7, lte: 8 }
  else if (filter === 'detractors') where.score = { lte: 6 }

  // Note: Prisma generates camelCase from model names, so NPSSurvey -> nPSSurvey
  try {
    const surveys = await (prisma as any).nPSSurvey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ surveys })
  } catch (error: any) {
    // Model might not exist yet, return empty array
    console.error('NPS Survey fetch error:', error)
    return NextResponse.json({ surveys: [] })
  }
}

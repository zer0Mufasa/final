import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where: any = {}
  if (status) where.status = status

  const experiments = await prisma.experiment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({
    experiments: experiments.map((exp) => ({
      id: exp.id,
      name: exp.name,
      hypothesis: exp.hypothesis,
      metric: exp.metric,
      variants: exp.variants,
      allocation: exp.allocation,
      targetSegment: exp.targetSegment,
      status: exp.status,
      startedAt: exp.startedAt?.toISOString() || null,
      endedAt: exp.endedAt?.toISOString() || null,
      results: exp.results,
      winner: exp.winner,
      createdAt: exp.createdAt.toISOString(),
      updatedAt: exp.updatedAt.toISOString(),
      createdBy: exp.createdBy,
    })),
  })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'experiment.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { name, hypothesis, metric, variants, allocation, targetSegment } = body || {}

  if (!name || !metric || !variants || !Array.isArray(variants)) {
    return NextResponse.json({ error: 'name, metric, and variants array are required' }, { status: 400 })
  }

  const experiment = await prisma.experiment.create({
    data: {
      name,
      hypothesis: hypothesis || null,
      metric,
      variants,
      allocation: allocation || { control: 50, treatment: 50 },
      targetSegment: targetSegment || null,
      status: 'draft',
      createdById: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'experiment.create',
    'experiment',
    experiment.id,
    `Created experiment: ${experiment.name}`,
    { name, metric },
    request
  )

  return NextResponse.json({ experiment }, { status: 201 })
}

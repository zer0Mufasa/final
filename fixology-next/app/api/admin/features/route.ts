import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('isActive')
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 50)))

  const where: any = {}
  if (isActive !== null) where.enabled = isActive === 'true'

  const [flags, totalCount] = await prisma.$transaction([
    prisma.featureFlag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.featureFlag.count({ where }),
  ])

  // Backward-compat: admin UI expects isActive + metadata
  const formattedFlags = flags.map((f) => ({
    ...f,
    isActive: f.enabled,
    metadata: {
      enabledForAll: f.enabledForAll,
      enabledPlans: f.enabledPlans,
      enabledShops: f.enabledShops,
      percentage: f.percentage,
    },
  }))

  return NextResponse.json({ flags: formattedFlags, totalCount })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'feature.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { key, name, description, isActive, metadata } = body || {}

  if (!key || !name) {
    return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
  }

  const existing = await prisma.featureFlag.findUnique({ where: { key } })
  if (existing) {
    return NextResponse.json({ error: 'Feature flag with this key already exists' }, { status: 400 })
  }

  const flag = await prisma.featureFlag.create({
    data: {
      key,
      name,
      description: description || null,
      enabled: isActive !== undefined ? Boolean(isActive) : false,
      enabledForAll: Boolean(metadata?.enabledForAll ?? false),
      enabledPlans: Array.isArray(metadata?.enabledPlans) ? metadata.enabledPlans : [],
      enabledShops: Array.isArray(metadata?.enabledShops) ? metadata.enabledShops : [],
      percentage: typeof metadata?.percentage === 'number' ? metadata.percentage : null,
    },
  })

  await logAdminAction(
    admin,
    'feature.create',
    'feature_flag',
    flag.id,
    `Created feature flag: ${flag.name} (${flag.key})`,
    { key, name, isActive: flag.enabled },
    request
  )

  return NextResponse.json(
    {
      flag: {
        ...flag,
        isActive: flag.enabled,
        metadata: {
          enabledForAll: flag.enabledForAll,
          enabledPlans: flag.enabledPlans,
          enabledShops: flag.enabledShops,
          percentage: flag.percentage,
        },
      },
    },
    { status: 201 }
  )
}

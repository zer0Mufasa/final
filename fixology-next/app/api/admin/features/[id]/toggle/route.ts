import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'feature.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const flag = await prisma.featureFlag.findUnique({ where: { id: params.id } })
  if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

  const updated = await prisma.featureFlag.update({
    where: { id: params.id },
    data: { enabled: !flag.enabled },
  })

  await logAdminAction(
    admin,
    'feature.toggle',
    'feature_flag',
    updated.id,
    `Toggled feature flag: ${updated.name} (${updated.key}) to ${updated.enabled ? 'active' : 'inactive'}`,
    { oldValue: flag.enabled, newValue: updated.enabled },
    request
  )

  return NextResponse.json({
    success: true,
    flag: {
      ...updated,
      isActive: updated.enabled,
      metadata: {
        enabledForAll: updated.enabledForAll,
        enabledPlans: updated.enabledPlans,
        enabledShops: updated.enabledShops,
        percentage: updated.percentage,
      },
    },
  })
}

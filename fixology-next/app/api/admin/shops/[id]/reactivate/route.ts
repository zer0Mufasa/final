import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const existing = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, status: true, features: true } })
  if (!existing) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const features = (existing.features as any) || {}
  const nextFeatures = { ...features }
  delete nextFeatures.suspendedAt
  delete nextFeatures.suspendedReason

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data: { status: 'ACTIVE', features: nextFeatures },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.reactivate',
      targetType: 'shop',
      targetId: shop.id,
      description: `Reactivated shop: ${shop.name}`,
      metadata: { previousStatus: existing.status },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true, shop })
}


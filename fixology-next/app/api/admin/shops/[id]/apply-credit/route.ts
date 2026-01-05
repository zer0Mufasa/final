import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'billing') && !canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const amountCents = Number(body?.amountCents)
  const reason = typeof body?.reason === 'string' ? body.reason : 'Admin credit'

  if (!Number.isFinite(amountCents) || amountCents === 0) {
    return NextResponse.json({ error: 'amountCents must be a non-zero number' }, { status: 400 })
  }

  const shop = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, features: true } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const features = (shop.features as any) || {}
  const prev = Number(features.adminCreditBalanceCents || 0)
  const next = prev + amountCents

  const updated = await prisma.shop.update({
    where: { id: params.id },
    data: {
      features: {
        ...features,
        adminCreditBalanceCents: next,
        adminCreditUpdatedAt: new Date().toISOString(),
      },
    },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.apply_credit',
      targetType: 'shop',
      targetId: shop.id,
      description: `Applied credit: ${amountCents} cents`,
      metadata: { amountCents, reason, previousBalanceCents: prev, newBalanceCents: next },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true, shop: updated, creditBalanceCents: next })
}


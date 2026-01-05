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

  const body = await request.json().catch(() => ({}))
  const days = Number(body?.days)
  if (!Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ error: 'days must be a positive number' }, { status: 400 })
  }

  const shop = await prisma.shop.findUnique({ where: { id: params.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const currentEnd = shop.trialEndsAt || new Date()
  const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000)

  const updated = await prisma.shop.update({
    where: { id: params.id },
    data: { trialEndsAt: newEnd },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.extend_trial',
      targetType: 'shop',
      targetId: updated.id,
      description: `Extended trial by ${days} days`,
      metadata: { days, previousTrialEndsAt: shop.trialEndsAt?.toISOString() || null, newTrialEndsAt: newEnd.toISOString() },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true, shop: updated })
}


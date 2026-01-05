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
  const plan = typeof body?.plan === 'string' ? body.plan : ''
  if (!plan) return NextResponse.json({ error: 'plan is required' }, { status: 400 })

  const existing = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, plan: true, status: true, trialEndsAt: true } })
  if (!existing) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // If moving to a paid plan, mark ACTIVE unless explicitly suspended/cancelled.
  const nextStatus =
    existing.status === 'SUSPENDED' || existing.status === 'CANCELLED'
      ? existing.status
      : plan === 'FREE'
        ? existing.status
        : 'ACTIVE'

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data: { plan: plan as any, status: nextStatus as any },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.change_plan',
      targetType: 'shop',
      targetId: shop.id,
      description: `Changed plan: ${existing.plan} → ${plan}`,
      metadata: { previousPlan: existing.plan, nextPlan: plan, previousStatus: existing.status, nextStatus },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true, shop })
}


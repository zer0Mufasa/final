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
  const reason = typeof body?.reason === 'string' ? body.reason : 'Suspended by admin'

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data: {
      status: 'SUSPENDED',
      features: {
        ...(await prisma.shop
          .findUnique({ where: { id: params.id }, select: { features: true } })
          .then((s) => (s?.features as any) || {})),
        suspendedAt: new Date().toISOString(),
        suspendedReason: reason,
      },
    },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.suspend',
      targetType: 'shop',
      targetId: shop.id,
      description: `Suspended shop: ${shop.name}`,
      metadata: { reason },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true, shop })
}


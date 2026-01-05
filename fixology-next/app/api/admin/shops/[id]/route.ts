import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({
    where: { id: params.id },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      _count: { select: { users: true, tickets: true, customers: true, invoices: true } },
    },
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  return NextResponse.json({ shop })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const before = await prisma.shop.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, phone: true, status: true, plan: true },
  })

  const body = await request.json().catch(() => null)
  const data: any = {}
  if (typeof body?.name === 'string') data.name = body.name.trim()
  if (typeof body?.email === 'string') data.email = body.email.trim()
  if (typeof body?.phone === 'string') data.phone = body.phone.trim()
  if (typeof body?.status === 'string') data.status = body.status
  if (typeof body?.plan === 'string') data.plan = body.plan

  const shop = await prisma.shop.update({
    where: { id: params.id },
    data,
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.update',
      targetType: 'shop',
      targetId: shop.id,
      description: `Updated shop: ${shop.name}`,
      metadata: { before, after: { id: shop.id, name: shop.name, email: shop.email, phone: shop.phone, status: shop.status, plan: shop.plan } },
      request,
    })
  } catch {}

  return NextResponse.json({ shop })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const before = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, status: true } })

  await prisma.shop.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.delete',
      targetType: 'shop',
      targetId: params.id,
      description: `Cancelled shop: ${before?.name || params.id}`,
      metadata: { before },
      request,
    })
  } catch {}

  return NextResponse.json({ success: true })
}


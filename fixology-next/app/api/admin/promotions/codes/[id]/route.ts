import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'promotion.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { isActive, expiresAt, maxUses } = body || {}

  const code = await prisma.discountCode.findUnique({ where: { id: params.id } })
  if (!code) return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })

  const updated = await prisma.discountCode.update({
    where: { id: params.id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(maxUses !== undefined && { maxUses }),
    },
  })

  await logAdminAction(
    admin,
    'promotion.update',
    'discount_code',
    updated.id,
    `Updated discount code: ${updated.code}`,
    { isActive, expiresAt, maxUses },
    request
  )

  return NextResponse.json({ code: updated })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'promotion.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const code = await prisma.discountCode.findUnique({ where: { id: params.id } })
  if (!code) return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })

  await prisma.discountCode.delete({ where: { id: params.id } })

  await logAdminAction(
    admin,
    'promotion.delete',
    'discount_code',
    code.id,
    `Deleted discount code: ${code.code}`,
    {},
    request
  )

  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codes })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'promotion.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { code, type, amount, maxUses, validPlans, expiresAt } = body || {}

  if (!code || !type || !amount) {
    return NextResponse.json({ error: 'code, type, and amount are required' }, { status: 400 })
  }

  const discountCode = await prisma.discountCode.create({
    data: {
      code: code.toUpperCase(),
      type: type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
      amount: type === 'percentage' ? amount : amount * 100, // Convert dollars to cents
      maxUses,
      validPlans: validPlans || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  await logAdminAction(
    admin,
    'promotion.create',
    'discount_code',
    discountCode.id,
    `Created discount code: ${discountCode.code}`,
    { code: discountCode.code, type: discountCode.type, amount: discountCode.amount },
    request
  )

  return NextResponse.json({ code: discountCode }, { status: 201 })
}

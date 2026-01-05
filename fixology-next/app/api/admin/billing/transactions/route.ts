import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') || 25)))
  const q = (searchParams.get('q') || '').trim()
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')

  const where: any = {
    status: { in: ['PAID', 'PARTIAL'] },
    ...(dateFrom || dateTo
      ? {
          paidAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          shop: {
            OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }],
          },
        }
      : {}),
  }

  const total = await prisma.invoice.count({ where })
  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { paidAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      invoiceNumber: true,
      amountPaid: true,
      total: true,
      paymentMethod: true,
      paidAt: true,
      createdAt: true,
      shop: { select: { id: true, name: true, slug: true } },
    },
  })

  return NextResponse.json({
    page,
    pageSize,
    total,
    transactions: invoices.map((inv) => ({
      id: inv.id,
      type: 'invoice_payment',
      status: 'succeeded',
      amount: Number(inv.amountPaid || inv.total),
      method: inv.paymentMethod || 'OTHER',
      reference: null,
      createdAt: (inv.paidAt || inv.createdAt).toISOString(),
      shop: inv.shop,
      invoice: { id: inv.id, invoiceNumber: inv.invoiceNumber },
    })),
  })
}


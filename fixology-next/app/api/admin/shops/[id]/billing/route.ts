import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true, slug: true } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const invoices = await prisma.invoice.findMany({
    where: { shopId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      customer: { select: { firstName: true, lastName: true, phone: true } },
    },
  })

  const rows = invoices.map((inv) => {
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      amountDue: Number(inv.amountDue),
      issuedAt: inv.issuedAt?.toISOString() || null,
      dueAt: inv.dueAt?.toISOString() || null,
      paidAt: inv.paidAt?.toISOString() || null,
      createdAt: inv.createdAt.toISOString(),
      customerName: `${inv.customer.firstName} ${inv.customer.lastName}`.trim(),
      customerPhone: inv.customer.phone,
      payments: [],
      derivedPaidAmount: Number(inv.amountPaid),
    }
  })

  return NextResponse.json({ shop, invoices: rows })
}


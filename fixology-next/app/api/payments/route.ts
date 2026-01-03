import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function dbMethodToUi(method: string) {
  const m = String(method || 'CASH').toUpperCase()
  if (m === 'CASH') return 'cash'
  if (m === 'CARD') return 'card'
  if (m === 'CHECK') return 'check'
  return 'other'
}

export async function GET(_request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          shopId: context.shopId,
        },
      },
      include: {
        invoice: {
          include: {
            customer: true,
            ticket: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const list = payments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      invoiceNumber: p.invoice?.invoiceNumber ?? undefined,
      ticketId: p.invoice?.ticketId ?? undefined,
      ticketNumber: p.invoice?.ticket?.ticketNumber ?? undefined,
      customerId: p.invoice?.customerId ?? undefined,
      customerName: p.invoice?.customer
        ? `${p.invoice.customer.firstName} ${p.invoice.customer.lastName}`.trim()
        : 'Customer',
      amount: Number(p.amount),
      tip: 0,
      totalAmount: Number(p.amount),
      method: dbMethodToUi(p.method as any),
      reference: p.reference ?? undefined,
      status: Number(p.amount) < 0 ? 'refunded' : 'completed',
      processor: undefined,
      processorFee: 0,
      netAmount: Number(p.amount),
      refundedAmount: Number(p.amount) < 0 ? Math.abs(Number(p.amount)) : undefined,
      refundReason: Number(p.amount) < 0 ? 'Manual refund' : undefined,
      refundedAt: Number(p.amount) < 0 ? p.createdAt.toISOString() : undefined,
      collectedBy: context.user.id,
      collectedByName: context.user.name || 'Staff',
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.createdAt.toISOString(),
    }))

    return NextResponse.json({ payments: list }, { status: 200 })
  } catch (error: any) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}


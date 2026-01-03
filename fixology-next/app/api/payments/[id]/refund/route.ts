import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function toMoney(n: number) {
  return Math.round(n * 100) / 100
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json().catch(() => ({}))
    const reason = body?.reason ? String(body.reason) : 'Manual refund'

    const payment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        invoice: { shopId: context.shopId },
      },
      include: { invoice: true },
    })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    const amount = Number(payment.amount)
    if (amount <= 0) return NextResponse.json({ error: 'Payment is not refundable' }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: payment.invoiceId,
          amount: toMoney(-amount),
          method: payment.method,
          reference: payment.reference,
          notes: reason,
        },
      })

      const invoice = payment.invoice
      const nextPaid = toMoney(Math.max(0, Number(invoice.amountPaid) - amount))
      const nextDue = Math.max(0, toMoney(Number(invoice.total) - nextPaid))

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: nextPaid,
          amountDue: nextDue,
          status: 'REFUNDED',
        },
      })
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: error.message || 'Failed to refund payment' }, { status: 500 })
  }
}


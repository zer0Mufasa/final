import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function toMoney(n: number) {
  return Math.round(n * 100) / 100
}

function normalizeMethod(value: any) {
  const s = String(value || 'CASH').toUpperCase()
  const allowed = new Set(['CASH', 'CARD', 'CHECK', 'OTHER'])
  return allowed.has(s) ? (s as any) : ('CASH' as any)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()
    const amount = Number(body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const method = normalizeMethod(body?.method)
    const reference = body?.reference ? String(body.reference) : null
    const notes = body?.notes ? String(body.notes) : null

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: toMoney(amount),
          method,
          reference,
          notes,
        },
      })

      const nextPaid = toMoney(Number(invoice.amountPaid) + toMoney(amount))
      const nextDue = Math.max(0, toMoney(Number(invoice.total) - nextPaid))

      return await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: nextPaid,
          amountDue: nextDue,
          status: nextDue === 0 ? 'PAID' : 'PARTIAL',
          paidAt: nextDue === 0 ? new Date() : invoice.paidAt,
        },
      })
    })

    return NextResponse.json({ success: true, amountPaid: updated.amountPaid, amountDue: updated.amountDue, status: updated.status }, { status: 200 })
  } catch (error: any) {
    console.error('Invoice payment error:', error)
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}


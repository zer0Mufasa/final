import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export async function GET(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

    const invoice = await prisma.invoice.findFirst({
      where: { shopId: context.shopId, invoiceNumber: q },
      select: { id: true, invoiceNumber: true },
    })

    if (invoice) return NextResponse.json({ type: 'invoice', id: invoice.id, invoiceNumber: invoice.invoiceNumber }, { status: 200 })

    const ticket = await prisma.ticket.findFirst({
      where: { shopId: context.shopId, ticketNumber: q },
      include: { invoice: { select: { id: true, invoiceNumber: true } } },
    })

    if (ticket?.invoice) {
      return NextResponse.json({ type: 'invoice', id: ticket.invoice.id, invoiceNumber: ticket.invoice.invoiceNumber }, { status: 200 })
    }

    return NextResponse.json({ error: 'No matching invoice found' }, { status: 404 })
  } catch (error: any) {
    console.error('Invoice lookup error:', error)
    return NextResponse.json({ error: error.message || 'Failed to lookup invoice' }, { status: 500 })
  }
}


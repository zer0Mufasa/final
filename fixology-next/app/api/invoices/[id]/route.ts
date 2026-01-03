import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function dbStatusToUi(status: string) {
  return String(status || 'DRAFT').toLowerCase()
}

function uiStatusToDb(status: string) {
  const s = String(status || 'draft').toUpperCase()
  const allowed = new Set([
    'DRAFT',
    'SENT',
    'VIEWED',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED',
  ])
  return allowed.has(s) ? (s as any) : ('DRAFT' as any)
}

function toUiInvoice(inv: any) {
  const customerName = inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}`.trim() : 'Unknown'
  const status = dbStatusToUi(inv.status)
  const createdAt = inv.createdAt?.toISOString?.() ?? new Date(inv.createdAt).toISOString()
  const issueDate = inv.issuedAt ? new Date(inv.issuedAt).toISOString() : createdAt
  const dueDate = inv.dueAt ? new Date(inv.dueAt).toISOString() : createdAt

  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    ticketId: inv.ticketId ?? undefined,
    ticketNumber: inv.ticket?.ticketNumber ?? undefined,
    customerId: inv.customerId,
    customerName,
    customerEmail: inv.customer?.email ?? undefined,
    customerPhone: inv.customer?.phone ?? '',
    items: (inv.items || []).map((it: any) => ({
      id: it.id,
      type: it.inventoryId ? 'part' : 'labor',
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
      partId: it.inventoryId ?? undefined,
      warrantyIncluded: false,
    })),
    subtotal: Number(inv.subtotal),
    taxRate: Number(inv.taxRate),
    taxAmount: Number(inv.taxAmount),
    discount: Number(inv.discount),
    discountType: 'fixed' as const,
    total: Number(inv.total),
    status,
    amountPaid: Number(inv.amountPaid),
    amountDue: Number(inv.amountDue),
    issueDate,
    dueDate,
    paidDate: inv.paidAt ? new Date(inv.paidAt).toISOString() : undefined,
    sentVia: undefined,
    sentAt: inv.issuedAt ? new Date(inv.issuedAt).toISOString() : undefined,
    viewedAt: undefined,
    paymentLink: undefined,
    notes: inv.notes ?? undefined,
    createdBy: 'System',
    createdAt,
    updatedAt: inv.updatedAt?.toISOString?.() ?? new Date(inv.updatedAt).toISOString(),
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, shopId: context.shopId },
      include: { customer: true, ticket: true, items: true, payments: true },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    return NextResponse.json({ invoice: toUiInvoice(invoice) }, { status: 200 })
  } catch (error: any) {
    console.error('Invoice GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()
    const data: any = {}

    if (body?.status != null) {
      const nextStatus = uiStatusToDb(body.status)
      data.status = nextStatus
      if (nextStatus === 'SENT' && !body?.issuedAt) data.issuedAt = new Date()
      if (nextStatus === 'PAID') {
        data.paidAt = new Date()
        data.amountDue = 0
      }
    }

    if (body?.notes != null) data.notes = String(body.notes)

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, shopId: context.shopId },
      include: { customer: true, ticket: true, items: true, payments: true },
    })
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data,
      include: { customer: true, ticket: true, items: true, payments: true },
    })

    return NextResponse.json({ success: true, invoice: toUiInvoice(updated) }, { status: 200 })
  } catch (error: any) {
    console.error('Invoice PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const existing = await prisma.invoice.findFirst({ where: { id: params.id, shopId: context.shopId } })
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    await prisma.invoice.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Invoice DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 })
  }
}


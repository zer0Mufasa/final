import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function toMoney(n: number) {
  return Math.round(n * 100) / 100
}

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

export async function GET(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const invoices = await prisma.invoice.findMany({
      where: { shopId: context.shopId },
      include: {
        customer: true,
        ticket: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invoices: invoices.map(toUiInvoice) }, { status: 200 })
  } catch (error: any) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()
    const customerId = String(body?.customerId || '').trim()
    if (!customerId) return NextResponse.json({ error: 'customerId is required' }, { status: 400 })

    const itemsInput = Array.isArray(body?.items) ? body.items : []
    if (itemsInput.length === 0) return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })

    const taxRate = Number.isFinite(Number(body?.taxRate)) ? Number(body.taxRate) : 0
    const discount = Number.isFinite(Number(body?.discount)) ? Number(body.discount) : 0
    const notes = body?.notes ? String(body.notes) : null
    const dueAt = body?.dueAt ? new Date(body.dueAt) : null
    const status = uiStatusToDb(body?.status)

    const normalizedItems = itemsInput
      .map((it: any) => ({
        description: String(it?.description || '').trim(),
        quantity: Number.isFinite(Number(it?.quantity)) ? Math.max(1, Math.trunc(Number(it.quantity))) : 1,
        unitPrice: Number.isFinite(Number(it?.unitPrice)) ? Number(it.unitPrice) : 0,
      }))
      .filter((it: any) => it.description.length > 0)

    if (normalizedItems.length === 0) return NextResponse.json({ error: 'Line items must have descriptions' }, { status: 400 })

    const subtotal = toMoney(normalizedItems.reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0))
    const taxAmount = toMoney(subtotal * taxRate)
    const total = toMoney(subtotal + taxAmount - discount)

    const created = await prisma.$transaction(async (tx) => {
      const count = await tx.invoice.count({ where: { shopId: context.shopId } })
      const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`

      return await tx.invoice.create({
        data: {
          shopId: context.shopId,
          invoiceNumber,
          customerId,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          amountPaid: 0,
          amountDue: total,
          status,
          issuedAt: status === 'SENT' ? new Date() : null,
          dueAt,
          notes,
          items: {
            create: normalizedItems.map((it: any) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: toMoney(it.quantity * it.unitPrice),
            })),
          },
        },
        include: { customer: true, ticket: true, items: true, payments: true },
      })
    })

    return NextResponse.json({ success: true, invoice: toUiInvoice(created) }, { status: 201 })
  } catch (error: any) {
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 })
  }
}


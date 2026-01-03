import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

function toMoney(n: number) {
  return Math.round(n * 100) / 100
}

function readFeaturesEstimates(features: any) {
  const arr = features?.estimates
  return Array.isArray(arr) ? arr : []
}

function nextEstimateNumber(existing: any[]) {
  const max = existing
    .map((e) => String(e?.estimateNumber || ''))
    .map((s) => {
      const m = s.match(/EST-(\d+)/)
      return m ? Number(m[1]) : 0
    })
    .reduce((a, b) => Math.max(a, b), 0)
  return `EST-${String(max + 1).padStart(4, '0')}`
}

export async function GET(_request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const estimates = readFeaturesEstimates(features)
    return NextResponse.json({ estimates }, { status: 200 })
  } catch (error: any) {
    console.error('Estimates GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch estimates' }, { status: 500 })
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

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, shopId: context.shopId },
    })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const status = (String(body?.status || 'draft') as EstimateStatus) || 'draft'
    const deviceType = String(body?.deviceType || '').trim() || 'Device'
    const deviceModel = String(body?.deviceModel || '').trim() || ''
    const deviceCondition = body?.deviceCondition ? String(body.deviceCondition) : undefined

    const itemsInput = Array.isArray(body?.items) ? body.items : []
    const normalizedItems = itemsInput
      .map((it: any) => ({
        id: crypto.randomUUID(),
        type: (String(it?.type || 'part') as any) as 'labor' | 'part' | 'accessory' | 'other',
        description: String(it?.description || '').trim(),
        quantity: Number.isFinite(Number(it?.quantity)) ? Math.max(1, Math.trunc(Number(it.quantity))) : 1,
        unitPrice: Number.isFinite(Number(it?.unitPrice)) ? Number(it.unitPrice) : 0,
      }))
      .filter((it: any) => it.description.length > 0)
      .map((it: any) => ({ ...it, total: toMoney(it.quantity * it.unitPrice) }))

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item with a description is required' }, { status: 400 })
    }

    const taxRate = Number.isFinite(Number(body?.taxRate)) ? Number(body.taxRate) : 0.0825
    const subtotal = toMoney(normalizedItems.reduce((sum: number, it: any) => sum + it.total, 0))
    const taxAmount = toMoney(subtotal * taxRate)
    const total = toMoney(subtotal + taxAmount)

    const validUntil =
      body?.validUntil != null
        ? new Date(body.validUntil).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString()

    const notes = body?.notes ? String(body.notes) : undefined

    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const existing = readFeaturesEstimates(features)

    const estimate = {
      id: crypto.randomUUID(),
      estimateNumber: nextEstimateNumber(existing),
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerPhone: customer.phone,
      customerEmail: customer.email || undefined,
      deviceType,
      deviceModel,
      deviceCondition,
      items: normalizedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status,
      validUntil,
      notes,
      createdBy: context.user.name || context.user.email || 'Staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const nextEstimates = [estimate, ...existing].slice(0, 500)

    await prisma.shop.update({
      where: { id: context.shopId },
      data: {
        features: {
          ...features,
          estimates: nextEstimates,
        },
      },
    })

    return NextResponse.json({ success: true, estimate }, { status: 201 })
  } catch (error: any) {
    console.error('Estimates POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create estimate' }, { status: 500 })
  }
}


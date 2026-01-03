import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

type UiInventoryCategory =
  | 'screens'
  | 'batteries'
  | 'ports'
  | 'cameras'
  | 'speakers'
  | 'housings'
  | 'adhesives'
  | 'tools'
  | 'accessories'
  | 'other'

function normalizeCategoryKey(value: any): UiInventoryCategory {
  const v = String(value || '').toLowerCase()
  const allowed: UiInventoryCategory[] = [
    'screens',
    'batteries',
    'ports',
    'cameras',
    'speakers',
    'housings',
    'adhesives',
    'tools',
    'accessories',
    'other',
  ]
  return (allowed as string[]).includes(v) ? (v as UiInventoryCategory) : 'other'
}

function mapUiToDbCategory(key: UiInventoryCategory) {
  if (key === 'tools') return 'TOOLS' as const
  if (key === 'accessories') return 'ACCESSORIES' as const
  return 'PARTS' as const
}

function toUiItem(inv: any) {
  const categoryKey = normalizeCategoryKey(inv.model)
  return {
    id: inv.id,
    name: inv.name,
    sku: inv.sku || '',
    category: categoryKey,
    vendor: inv.brand || '—',
    onHand: inv.quantity ?? 0,
    min: inv.minStock ?? 0,
    unitCost: inv.costPrice != null ? Number(inv.costPrice) : 0,
    retail: inv.sellPrice != null ? Number(inv.sellPrice) : 0,
    location: inv.location || '',
    isActive: Boolean(inv.isActive),
    updatedAt: inv.updatedAt,
    createdAt: inv.createdAt,
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })
    if (!item) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    return NextResponse.json({ item: toUiItem(item) }, { status: 200 })
  } catch (error: any) {
    console.error('Inventory item GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory item' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()

    const data: any = {}
    if (body?.name != null) data.name = String(body.name).trim()
    if (body?.sku != null) data.sku = String(body.sku).trim() || null
    if (body?.vendor != null) data.brand = String(body.vendor).trim() || null
    if (body?.location != null) data.location = String(body.location).trim() || null

    if (body?.category != null) {
      const categoryKey = normalizeCategoryKey(body.category)
      data.model = categoryKey
      data.category = mapUiToDbCategory(categoryKey)
    }

    if (body?.min != null && Number.isFinite(Number(body.min))) data.minStock = Math.max(0, Math.trunc(Number(body.min)))
    if (body?.unitCost != null && String(body.unitCost).trim() !== '' && Number.isFinite(Number(body.unitCost))) {
      data.costPrice = Number(body.unitCost)
    }
    if (body?.retail != null && Number.isFinite(Number(body.retail))) data.sellPrice = Number(body.retail)
    if (body?.isActive != null) data.isActive = Boolean(body.isActive)

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })
    if (!existing) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })

    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ success: true, item: toUiItem(updated) }, { status: 200 })
  } catch (error: any) {
    console.error('Inventory PATCH error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists for this shop' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update inventory item' }, { status: 500 })
  }
}


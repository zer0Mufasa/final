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

function mapUiToDbCategory(key: UiInventoryCategory) {
  // Prisma enum: PARTS | SERVICES | ACCESSORIES | DEVICES | TOOLS | PREPAID
  if (key === 'tools') return 'TOOLS' as const
  if (key === 'accessories') return 'ACCESSORIES' as const
  return 'PARTS' as const
}

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

function toUiItem(inv: any) {
  const categoryKey = normalizeCategoryKey(inv.model) // we persist the UI category key in `model`
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

export async function GET(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === '1'
    const items = await prisma.inventoryItem.findMany({
      where: {
        shopId: context.shopId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ items: items.map(toUiItem) }, { status: 200 })
  } catch (error: any) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()

    const name = String(body?.name || '').trim()
    const sku = body?.sku ? String(body.sku).trim() : null
    const vendor = body?.vendor ? String(body.vendor).trim() : null
    const location = body?.location ? String(body.location).trim() : null
    const categoryKey = normalizeCategoryKey(body?.category)

    const onHand = Number.isFinite(Number(body?.onHand)) ? Math.max(0, Math.trunc(Number(body.onHand))) : 0
    const min = Number.isFinite(Number(body?.min)) ? Math.max(0, Math.trunc(Number(body.min))) : 0
    const unitCost = body?.unitCost != null && String(body.unitCost).trim() !== '' ? Number(body.unitCost) : null
    const retail = Number.isFinite(Number(body?.retail)) ? Number(body.retail) : null

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (retail == null) return NextResponse.json({ error: 'Retail price is required' }, { status: 400 })

    const created = await prisma.inventoryItem.create({
      data: {
        shopId: context.shopId,
        name,
        sku,
        // Persist UI expectations without changing DB schema:
        // - vendor is stored as `brand`
        // - UI category key is stored as `model`
        brand: vendor,
        model: categoryKey,
        category: mapUiToDbCategory(categoryKey),
        location,
        quantity: onHand,
        minStock: min,
        costPrice: unitCost,
        sellPrice: retail,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, item: toUiItem(created) }, { status: 201 })
  } catch (error: any) {
    console.error('Inventory POST error:', error)
    // Unique constraint: @@unique([shopId, sku])
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists for this shop' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create inventory item' }, { status: 500 })
  }
}


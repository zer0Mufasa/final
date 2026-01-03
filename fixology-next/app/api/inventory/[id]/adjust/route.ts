import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()
    const delta = Number(body?.delta)
    if (!Number.isFinite(delta) || !Number.isInteger(delta)) {
      return NextResponse.json({ error: 'delta must be an integer' }, { status: 400 })
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })
    if (!existing) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })

    const nextQty = Math.max(0, (existing.quantity ?? 0) + delta)
    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: { quantity: nextQty },
    })

    return NextResponse.json(
      {
        success: true,
        item: {
          id: updated.id,
          quantity: updated.quantity,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Inventory adjust error:', error)
    return NextResponse.json({ error: error.message || 'Failed to adjust inventory' }, { status: 500 })
  }
}


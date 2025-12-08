// app/api/shops/[shopId]/route.ts
// Single shop operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'

// GET /api/shops/[shopId] - Get single shop
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const { shopId } = params

  // Check access
  if (isShopUser(context) && context.shopId !== shopId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            tickets: true,
            customers: true,
            inventory: true,
            invoices: true,
          },
        },
      },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json(shop)
  } catch (error) {
    console.error('Failed to fetch shop:', error)
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
  }
}

// PATCH /api/shops/[shopId] - Update shop
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const { shopId } = params

  // Check access - shop owners can update their own shop, admins can update any
  if (isShopUser(context)) {
    if (context.shopId !== shopId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (context.user.role !== 'OWNER' && context.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  }

  try {
    const body = await request.json()

    // Fields that shop users can update
    const shopUserFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'timezone', 'currency', 'logoUrl']
    
    // Fields that only admins can update
    const adminOnlyFields = ['plan', 'status', 'features', 'stripeCustomerId', 'stripeSubscriptionId', 'trialEndsAt']

    // Filter allowed fields based on user type
    const allowedFields = isPlatformAdmin(context)
      ? [...shopUserFields, ...adminOnlyFields]
      : shopUserFields

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: updateData,
    })

    return NextResponse.json(shop)
  } catch (error) {
    console.error('Failed to update shop:', error)
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}

// DELETE /api/shops/[shopId] - Delete shop (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isPlatformAdmin(context)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { shopId } = params

  try {
    // Soft delete - change status to CANCELLED
    await prisma.shop.update({
      where: { id: shopId },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete shop:', error)
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 })
  }
}


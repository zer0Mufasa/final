import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export async function GET(_request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })

    const features = (shop?.features as any) || {}
    const events = Array.isArray(features.activityLog) ? features.activityLog : []

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Failed to fetch activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}


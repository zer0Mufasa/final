// app/api/me/preferences/route.ts
// Store per-user UI preferences (and a couple dashboard toggles) in shop_users.permissions JSON.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

type Prefs = Record<string, any>

export async function GET() {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const [user, shop] = await Promise.all([
    prisma.shopUser.findUnique({
      where: { id: context.user.id },
      select: { permissions: true },
    }),
    prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    }),
  ])

  const perms = (user?.permissions as Prefs) ?? {}
  const features = (shop?.features as any) || {}

  // Surface shopOpen from shop.features so the UI stays in sync after reload
  const preferences: Prefs = {
    ...perms,
    ...(typeof features.shopOpen === 'boolean' ? { shopOpen: features.shopOpen } : {}),
  }

  return NextResponse.json({ preferences })
}

export async function PATCH(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const patch = (await request.json().catch(() => null)) as Prefs | null
    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { shopOpen, ...rest } = patch as Prefs & { shopOpen?: boolean }

    const current = await prisma.shopUser.findUnique({
      where: { id: context.user.id },
      select: { permissions: true, name: true, email: true },
    })

    const actorName = (current?.name && current.name.trim()) || current?.email || context.user.email

    // Handle shop open/close tracking at the shop level
    let latestFeatures: any = null

    if (typeof shopOpen === 'boolean') {
      const shop = await prisma.shop.findUnique({
        where: { id: context.shopId },
        select: { features: true },
      })
      const features = (shop?.features as any) || {}
      const activityLog = Array.isArray(features.activityLog) ? features.activityLog : []
      const nextLog = [
        {
          id: crypto.randomUUID(),
          type: shopOpen ? 'shop_open' : 'shop_close',
          userId: context.user.id,
          userName: actorName,
          timestamp: new Date().toISOString(),
        },
        ...activityLog,
      ].slice(0, 200)

      const updatedShop = await prisma.shop.update({
        where: { id: context.shopId },
        data: {
          features: {
            ...features,
            shopOpen,
            activityLog: nextLog,
          },
        },
        select: { features: true },
      })
      latestFeatures = updatedShop.features
    }

    const merged: Prefs = {
      ...(current?.permissions as Prefs),
      ...(typeof shopOpen === 'boolean' ? { shopOpen } : {}),
      ...rest,
    }

    const updated = await prisma.shopUser.update({
      where: { id: context.user.id },
      data: { permissions: merged },
      select: { permissions: true },
    })

    const preferences: Prefs = {
      ...(updated.permissions as Prefs),
      ...(latestFeatures && typeof (latestFeatures as any).shopOpen === 'boolean'
        ? { shopOpen: (latestFeatures as any).shopOpen }
        : {}),
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('preferences PATCH error', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}


// app/api/me/preferences/route.ts
// Store per-user UI preferences (and a couple dashboard toggles) in shop_users.permissions JSON.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

type Prefs = Record<string, any>

type DemoState = {
  shopOpen?: boolean
  preferences?: Prefs
  activity?: any[]
}

function readActor(req: NextRequest): { id: string; name: string } {
  try {
    const raw = req.cookies.get('fx_actor')?.value
    if (!raw) return { id: 'demo', name: 'Demo User' }
    const parsed = JSON.parse(decodeURIComponent(raw))
    const id = typeof parsed?.id === 'string' ? parsed.id : 'demo'
    const name = typeof parsed?.name === 'string' ? parsed.name : 'Demo User'
    return { id, name }
  } catch {
    return { id: 'demo', name: 'Demo User' }
  }
}

function readDemoState(req: NextRequest): DemoState {
  try {
    const raw = req.cookies.get('fx_demo_state')?.value
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as DemoState) : {}
  } catch {
    return {}
  }
}

function writeDemoState(res: NextResponse, next: DemoState) {
  res.cookies.set({
    name: 'fx_demo_state',
    value: JSON.stringify(next),
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
  })
}

function isDemo(req: NextRequest) {
  return req.cookies.get('fx_demo')?.value === '1'
}

export async function GET(request: NextRequest) {
  // Demo mode: store prefs in a cookie-backed state object
  if (isDemo(request)) {
    const state = readDemoState(request)
    const preferences: Prefs = {
      ...(state.preferences || {}),
      ...(typeof state.shopOpen === 'boolean' ? { shopOpen: state.shopOpen } : {}),
    }
    return NextResponse.json({ preferences })
  }

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
  // Demo mode: persist to cookie and return success (lets dashboard toggles work without auth/DB)
  if (isDemo(request)) {
    const actor = readActor(request)
    const patch = (await request.json().catch(() => null)) as Prefs | null
    if (!patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { shopOpen, ...rest } = patch as Prefs & { shopOpen?: boolean }
    const state = readDemoState(request)

    const nextActivity = Array.isArray(state.activity) ? state.activity.slice(0) : []
    if (typeof shopOpen === 'boolean') {
      nextActivity.unshift({
        id: crypto.randomUUID(),
        type: shopOpen ? 'shop_open' : 'shop_close',
        userId: actor.id,
        userName: actor.name,
        timestamp: new Date().toISOString(),
      })
    }

    const nextState: DemoState = {
      ...state,
      ...(typeof shopOpen === 'boolean' ? { shopOpen } : {}),
      preferences: { ...(state.preferences || {}), ...rest, ...(typeof shopOpen === 'boolean' ? { shopOpen } : {}) },
      activity: nextActivity.slice(0, 50),
    }

    const res = NextResponse.json({
      preferences: {
        ...(nextState.preferences || {}),
        ...(typeof nextState.shopOpen === 'boolean' ? { shopOpen: nextState.shopOpen } : {}),
      },
    })
    writeDemoState(res, nextState)
    return res
  }

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


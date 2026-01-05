// app/api/time-entries/clock/route.ts
// Clock in/out for the current shop user.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

// No-op safeguards (legacy; table may not have these columns)
async function ensureColumns() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS opened_shop boolean DEFAULT false'
    )
    await prisma.$executeRawUnsafe(
      'ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS closed_shop boolean DEFAULT false'
    )
    await prisma.$executeRawUnsafe(
      'ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS break_minutes integer DEFAULT 0'
    )
  } catch (err) {
    // ignore
  }
}

async function appendActivity(shopId: string, features: any, event: any) {
  const activityLog = Array.isArray(features?.activityLog) ? features.activityLog : []
  const nextLog = [
    {
      id: crypto.randomUUID(),
      ...event,
    },
    ...activityLog,
  ].slice(0, 200)

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      features: {
        ...features,
        activityLog: nextLog,
      },
    },
  })
}

export async function GET() {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  await ensureColumns()

  const open = await prisma.timeEntry.findFirst({
    where: { shopId: context.shopId, userId: context.user.id, clockOut: null },
    orderBy: { clockIn: 'desc' },
  })

  return NextResponse.json({
    clockedIn: !!open,
    entry: open,
  })
}

export async function POST(request: NextRequest) {
  try {
    const context = await getShopContext()
    if (isContextError(context)) {
      return NextResponse.json({ error: context.error }, { status: context.status })
    }
    if (!isShopUser(context)) {
      return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const intent = typeof body?.intent === 'string' ? body.intent : 'toggle'

    // Fetch the current user display info for activity logs
    const shopUser = await prisma.shopUser.findUnique({
      where: { id: context.user.id },
    select: { name: true, email: true },
    })
    const displayName =
    (shopUser?.name && shopUser.name.trim()) ||
    (shopUser?.email && shopUser.email.trim()) ||
    (context.user.name && context.user.name.trim()) ||
    (context.user.email && context.user.email.trim()) ||
    'Staff'

    // Ensure schema columns exist (best-effort)
    await ensureColumns()

    const open = await prisma.timeEntry.findFirst({
      where: {
        shopId: context.shopId,
        userId: context.user.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    })

    // If explicit intent, honor it. Otherwise toggle.
    if (intent === 'clock_out' || (intent === 'toggle' && open)) {
      if (!open) {
        return NextResponse.json({ error: 'No open time entry' }, { status: 409 })
      }
    const closed = await prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOut: new Date() },
    })

      // If this is the last open entry for the shop, mark closedShop
    const stillOpen = await prisma.timeEntry.findFirst({
      where: {
        shopId: context.shopId,
        clockOut: null,
        id: { not: open.id },
      },
    })
      if (!stillOpen) {
        try {
          await prisma.timeEntry.update({
            where: { id: closed.id },
            data: { closedShop: true },
          })
        } catch (err: any) {
          const msg = err?.message || ''
          if (msg.includes('opened_shop') || msg.includes('closed_shop') || msg.includes('shop_id')) {
            await ensureColumns()
            await prisma.timeEntry.update({
              where: { id: closed.id },
              data: { closedShop: true },
            })
          } else {
          const detail = (err as any)?.meta?.message || msg || 'Unknown error'
          return NextResponse.json({ error: 'Mark close failed', detail }, { status: 500 })
          }
        }
        try {
          const shop = await prisma.shop.findUnique({ where: { id: context.shopId }, select: { features: true } })
          await appendActivity(context.shopId, (shop?.features as any) || {}, {
            type: 'shop_close',
            userId: context.user.id,
            userName: displayName,
            timestamp: new Date().toISOString(),
            entryId: closed.id,
          })
        } catch (err) {
          console.error('activity log shop_close failed', err)
        }
      }

      // Log activity
      try {
        const shop = await prisma.shop.findUnique({ where: { id: context.shopId }, select: { features: true } })
        await appendActivity(context.shopId, (shop?.features as any) || {}, {
          type: 'clock_out',
          userId: context.user.id,
          userName: displayName,
          timestamp: new Date().toISOString(),
          entryId: closed.id,
        })
      } catch (err) {
        console.error('activity log clock_out failed', err)
      }

      return NextResponse.json({ clockedIn: false, entry: closed })
    }

    // Determine if this user is opening the shop (first entry today for shop)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const existingToday = await prisma.timeEntry.findFirst({
      where: {
        shopId: context.shopId,
        clockIn: { gte: startOfDay },
      },
    })
    const isOpener = !existingToday

    const created = await prisma.timeEntry.create({
      data: {
        shopId: context.shopId,
        userId: context.user.id,
        clockIn: new Date(),
        breakMinutes: 0,
        openedShop: isOpener,
      },
    })
    // Log activity
    let shopFeatures: any = {}
    try {
      const shop = await prisma.shop.findUnique({ where: { id: context.shopId }, select: { features: true } })
      shopFeatures = (shop?.features as any) || {}
      await appendActivity(context.shopId, shopFeatures, {
        type: 'clock_in',
        userId: context.user.id,
        userName: displayName,
        timestamp: new Date().toISOString(),
        entryId: created.id,
      })
    } catch (err) {
      console.error('activity log clock_in failed', err)
    }

    if (isOpener) {
      try {
        await appendActivity(context.shopId, shopFeatures, {
          type: 'shop_open',
          userId: context.user.id,
          userName: displayName,
          timestamp: new Date().toISOString(),
          entryId: created.id,
        })
      } catch (err) {
        console.error('activity log shop_open failed', err)
      }
    }

    return NextResponse.json({ clockedIn: true, entry: created })
  } catch (error: any) {
    console.error('clock route error', error)
    const detail =
      error?.meta?.message ||
      error?.cause?.message ||
      error?.message ||
      'Unknown error'
    return NextResponse.json(
      {
        error: 'Clock endpoint failed',
        detail,
      },
      { status: 500 }
    )
  }
}


// app/api/time-entries/clock/route.ts
// Clock in/out for the current shop user.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

type DemoState = {
  shopOpen?: boolean
  // Multi-user demo tracking
  timeEntries?: Array<{
    id: string
    userId: string
    userName: string
    clockIn: string
    clockOut: string | null
    breakMinutes: number
    openedShop: boolean
    closedShop: boolean
    notes?: string | null
  }>
  activity?: any[]
  preferences?: Record<string, any>
}

function isDemo(req: NextRequest) {
  return req.cookies.get('fx_demo')?.value === '1'
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

export async function GET(request: NextRequest) {
  // Demo mode: allow UI to work without auth/DB
  if (isDemo(request)) {
    const actor = readActor(request)
    const state = readDemoState(request)
    const entries = Array.isArray(state.timeEntries) ? state.timeEntries : []
    const open = entries
      .filter((e) => e.userId === actor.id && !e.clockOut)
      .sort((a, b) => (a.clockIn < b.clockIn ? 1 : -1))[0]
    const clockedIn = !!open
    return NextResponse.json({
      clockedIn,
      entry: open || null,
    })
  }

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
  // Demo mode: keep state in cookie and return success
  if (isDemo(request)) {
    const body = await request.json().catch(() => ({}))
    const intent = typeof body?.intent === 'string' ? body.intent : 'toggle'

    const actor = readActor(request)
    const state = readDemoState(request)
    const entries = Array.isArray(state.timeEntries) ? state.timeEntries.slice(0) : []
    const open = entries
      .filter((e) => e.userId === actor.id && !e.clockOut)
      .sort((a, b) => (a.clockIn < b.clockIn ? 1 : -1))[0]
    const wasClockedIn = !!open

    const nextActivity = Array.isArray(state.activity) ? state.activity.slice(0) : []
    const nowIso = new Date().toISOString()

    let nextClockedIn = wasClockedIn
    let returnedEntry: any = null

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const anyEntryToday = entries.some((e) => new Date(e.clockIn) >= startOfDay)

    if (intent === 'clock_in' || (intent === 'toggle' && !wasClockedIn)) {
      nextClockedIn = true
      const created = {
        id: crypto.randomUUID(),
        userId: actor.id,
        userName: actor.name,
        clockIn: nowIso,
        clockOut: null,
        breakMinutes: 0,
        openedShop: !anyEntryToday,
        closedShop: false,
        notes: null,
      }
      entries.unshift(created)
      returnedEntry = created
      nextActivity.unshift({
        id: crypto.randomUUID(),
        type: 'clock_in',
        userId: actor.id,
        userName: actor.name,
        timestamp: nowIso,
        entryId: created.id,
      })
      if (!anyEntryToday) {
        nextActivity.unshift({
          id: crypto.randomUUID(),
          type: 'shop_open',
          userId: actor.id,
          userName: actor.name,
          timestamp: nowIso,
          entryId: created.id,
        })
      }
    } else if (intent === 'clock_out' || (intent === 'toggle' && wasClockedIn)) {
      nextClockedIn = false
      const idx = open ? entries.findIndex((e) => e.id === open.id) : -1
      const closed = open
        ? { ...open, clockOut: nowIso }
        : null
      if (closed && idx >= 0) entries[idx] = closed
      returnedEntry = closed
      nextActivity.unshift({
        id: crypto.randomUUID(),
        type: 'clock_out',
        userId: actor.id,
        userName: actor.name,
        timestamp: nowIso,
        entryId: open?.id || crypto.randomUUID(),
      })
    }

    const nextState: DemoState = {
      ...state,
      timeEntries: entries.slice(0, 200),
      activity: nextActivity.slice(0, 50),
    }

    const res = NextResponse.json({
      clockedIn: nextClockedIn,
      entry: returnedEntry,
    })
    writeDemoState(res, nextState)
    return res
  }

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


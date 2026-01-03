// app/api/time-entries/clock/route.ts
// Clock in/out for the current shop user.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

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

  const open = await prisma.timeEntry.findFirst({
    where: { userId: context.user.id, clockOut: null },
    orderBy: { clockIn: 'desc' },
  })

  return NextResponse.json({
    clockedIn: !!open,
    entry: open,
  })
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const intent = typeof body?.intent === 'string' ? body.intent : 'toggle'

  const open = await prisma.timeEntry.findFirst({
    where: { userId: context.user.id, clockOut: null },
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
    // Log activity
    const shop = await prisma.shop.findUnique({ where: { id: context.shopId }, select: { features: true } })
    await appendActivity(context.shopId, (shop?.features as any) || {}, {
      type: 'clock_out',
      userId: context.user.id,
      userName: context.user.name || context.user.email,
      timestamp: new Date().toISOString(),
      entryId: closed.id,
    })

    return NextResponse.json({ clockedIn: false, entry: closed })
  }

  const created = await prisma.timeEntry.create({
    data: {
      userId: context.user.id,
      clockIn: new Date(),
      breakMinutes: 0,
    },
  })

  // Log activity
  const shop = await prisma.shop.findUnique({ where: { id: context.shopId }, select: { features: true } })
  await appendActivity(context.shopId, (shop?.features as any) || {}, {
    type: 'clock_in',
    userId: context.user.id,
    userName: context.user.name || context.user.email,
    timestamp: new Date().toISOString(),
    entryId: created.id,
  })

  return NextResponse.json({ clockedIn: true, entry: created })
}


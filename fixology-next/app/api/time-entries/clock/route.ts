// app/api/time-entries/clock/route.ts
// Clock in/out for the current shop user.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

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
    return NextResponse.json({ clockedIn: false, entry: closed })
  }

  const created = await prisma.timeEntry.create({
    data: {
      userId: context.user.id,
      clockIn: new Date(),
      breakMinutes: 0,
    },
  })

  return NextResponse.json({ clockedIn: true, entry: created })
}


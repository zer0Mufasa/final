// Time Tracking API - list time entries

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'

// GET /api/time-tracking - List time entries for the shop
export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')
  const userId = searchParams.get('userId')

  try {
    // Get all shop user IDs first
    const shopUsers = await prisma.shopUser.findMany({
      where: { shopId: context.shopId },
      select: { id: true, name: true },
    })

    const shopUserIds = shopUsers.map((u) => u.id)

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: userId || { in: shopUserIds },
        clockIn: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { clockIn: 'desc' },
      take: 100,
    })

    const uiEntries = entries.map((e) => {
      const duration = e.clockOut
        ? Math.round((e.clockOut.getTime() - e.clockIn.getTime()) / 1000 / 60)
        : null

      return {
        id: e.id,
        userId: e.userId,
        userName: e.user.name,
        clockIn: e.clockIn.toISOString(),
        clockOut: e.clockOut?.toISOString() || null,
        durationMinutes: duration,
        breakMinutes: e.breakMinutes,
        notes: e.notes,
        status: e.clockOut ? 'completed' : 'active',
      }
    })

    // Calculate summary stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayEntries = uiEntries.filter((e) => new Date(e.clockIn) >= today)
    const totalMinutesToday = todayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0)
    const activeTimers = todayEntries.filter((e) => e.status === 'active').length

    return NextResponse.json({
      entries: uiEntries,
      summary: {
        totalHoursToday: Math.round((totalMinutesToday / 60) * 10) / 10,
        activeTimers,
        entriesCount: uiEntries.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

// POST /api/time-tracking - Create a time entry manually
const CreateTimeEntrySchema = z.object({
  userId: z.string().optional(), // Defaults to current user
  clockIn: z.string(), // ISO string
  clockOut: z.string().optional(),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const data = CreateTimeEntrySchema.parse(await request.json())

    const entry = await prisma.timeEntry.create({
      data: {
        userId: data.userId || context.user.id,
        clockIn: new Date(data.clockIn),
        clockOut: data.clockOut ? new Date(data.clockOut) : null,
        breakMinutes: data.breakMinutes,
        notes: data.notes,
      },
    })

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating time entry:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create time entry' },
      { status: 500 }
    )
  }
}

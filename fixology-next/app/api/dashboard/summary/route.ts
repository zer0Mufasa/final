import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export async function GET(_req: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  const now = new Date()
  const last30 = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
  const last7Start = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)) // include today

  try {
    const [created30, completed30, inProgress, waitingParts, activeTimers, invItems, payments] =
      await Promise.all([
        prisma.ticket.count({
          where: {
            shopId: context.shopId,
            createdAt: { gte: last30 },
          },
        }),
        prisma.ticket.count({
          where: {
            shopId: context.shopId,
            status: { in: ['READY', 'PICKED_UP'] },
            updatedAt: { gte: last30 },
          },
        }),
        prisma.ticket.count({
          where: {
            shopId: context.shopId,
            status: { in: ['INTAKE', 'DIAGNOSED', 'IN_PROGRESS'] },
          },
        }),
        prisma.ticket.count({
          where: {
            shopId: context.shopId,
            status: 'WAITING_PARTS',
          },
        }),
        prisma.timeEntry.count({
          where: {
            shopId: context.shopId,
            clockOut: null,
          },
        }),
        prisma.inventoryItem.findMany({
          where: { shopId: context.shopId, isActive: true },
          select: { quantity: true, minStock: true },
        }),
        prisma.payment.findMany({
          where: {
            invoice: { shopId: context.shopId },
            createdAt: { gte: last7Start },
          },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ])

    const lowStockCount = invItems.filter((i) => {
      const qty = Number(i.quantity ?? 0)
      const min = Number(i.minStock ?? 0)
      const threshold = min > 0 ? min : 2
      return qty <= threshold
    }).length

    // Build 7-day revenue series (today inclusive)
    const daily: { label: string; total: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(last7Start)
      d.setDate(d.getDate() + i)
      daily.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: 0,
      })
    }
    for (const p of payments) {
      const dayIndex = Math.min(
        6,
        Math.max(0, Math.floor((startOfDay(p.createdAt).getTime() - last7Start.getTime()) / (24 * 60 * 60 * 1000)))
      )
      daily[dayIndex].total += Number(p.amount) || 0
    }
    const last7Total = daily.reduce((s, d) => s + d.total, 0)
    const avgDaily = daily.length ? last7Total / daily.length : 0

    return NextResponse.json(
      {
        tickets: {
          createdLast30: created30,
          completedLast30: completed30,
          inProgress,
          waitingParts,
        },
        team: {
          activeTimers,
        },
        inventory: {
          lowStock: lowStockCount,
        },
        revenue: {
          last7Total,
          avgDaily,
          daily,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load dashboard summary' }, { status: 500 })
  }
}

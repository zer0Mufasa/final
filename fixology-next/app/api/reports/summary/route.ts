import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week'

  const now = new Date()
  const startDate = new Date(now)
  if (period === 'week') startDate.setDate(startDate.getDate() - 7)
  else if (period === 'month') startDate.setDate(startDate.getDate() - 30)
  else if (period === 'quarter') startDate.setMonth(startDate.getMonth() - 3)

  try {
    // Tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        shopId: context.shopId,
        createdAt: { gte: startDate },
      },
    })

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          shopId: context.shopId,
        },
        createdAt: { gte: startDate },
      },
      include: {
        invoice: true,
      },
    })

    // Time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        shopId: context.shopId,
        clockIn: { gte: startDate },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    // Revenue totals/by day
    const revenueTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const revenueByDayMap: Record<string, number> = {}
    payments.forEach((p) => {
      const day = new Date(p.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
      const amt = Number(p.amount || 0)
      revenueByDayMap[day] = (revenueByDayMap[day] || 0) + amt
    })
    const revenueByDay = Object.entries(revenueByDayMap).map(([day, amount]) => ({ day, amount }))

    // Ticket stats
    const completedTickets = tickets.filter((t) => t.status === 'PICKED_UP' || t.status === 'READY').length
    const ticketsByDayMap: Record<string, number> = {}
    tickets.forEach((t) => {
      const day = new Date(t.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
      ticketsByDayMap[day] = (ticketsByDayMap[day] || 0) + 1
    })
    const ticketsByDay = Object.entries(ticketsByDayMap).map(([day, count]) => ({ day, count }))

    // Hours by staff
    const hoursByStaff: Record<string, { staffId: string; staffName: string; hours: number }> = {}
    timeEntries.forEach((entry) => {
      if (!entry.clockOut) return
      const hours =
        (entry.clockOut.getTime() - entry.clockIn.getTime()) / 36e5 - entry.breakMinutes / 60
      const safeHours = Math.max(0, hours)
      const staffId = entry.userId
      const staffName = entry.user?.name || 'Staff'
      if (!hoursByStaff[staffId]) {
        hoursByStaff[staffId] = { staffId, staffName, hours: 0 }
      }
      hoursByStaff[staffId].hours += safeHours
    })
    const hoursTotal = Object.values(hoursByStaff).reduce((sum, s) => sum + s.hours, 0)
    const distinctDays = new Set(timeEntries.map((e) => e.clockIn.toISOString().slice(0, 10))).size
    const avgPerDay = distinctDays > 0 ? hoursTotal / distinctDays : 0

    // Top work types (simple heuristic based on deviceType)
    const deviceTypes: Record<string, number> = {}
    tickets.forEach((t) => {
      const type = t.deviceType || 'Other'
      deviceTypes[type] = (deviceTypes[type] || 0) + 1
    })
    const totalRepairs = tickets.length
    const topRepairs = Object.entries(deviceTypes)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalRepairs ? Math.round((count / totalRepairs) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      revenue: {
        total: revenueTotal,
        change: 0,
        byDay: revenueByDay,
      },
      tickets: {
        completed: completedTickets,
        change: 0,
        byDay: ticketsByDay,
      },
      hours: {
        total: Math.round(hoursTotal * 10) / 10,
        avgPerDay: Math.round(avgPerDay * 10) / 10,
        byStaff: Object.values(hoursByStaff).map((s) => ({
          staffId: s.staffId,
          staffName: s.staffName,
          hours: Math.round(s.hours * 10) / 10,
        })),
      },
      topRepairs,
    })
  } catch (error: any) {
    console.error('Reports summary error:', error)
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

function monthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const invoices = await prisma.invoice.findMany({
    where: { paidAt: { gte: start }, status: { in: ['PAID', 'PARTIAL'] } },
    select: { amountPaid: true, paidAt: true },
  })

  const map = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const ms = new Date(start.getFullYear(), start.getMonth() + i, 1)
    map.set(monthKey(ms), 0)
  }

  for (const inv of invoices) {
    const k = monthKey(inv.paidAt || start)
    if (!map.has(k)) continue
    map.set(k, (map.get(k) || 0) + Number(inv.amountPaid))
  }

  const points = Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue * 100) / 100 }))

  return NextResponse.json({ points })
}


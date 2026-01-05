import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true, features: true },
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const [tickets, invoices, audit] = await Promise.all([
    prisma.ticket.findMany({
      where: { shopId: params.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, ticketNumber: true, issueDescription: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.invoice.findMany({
      where: { shopId: params.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id: true, invoiceNumber: true, status: true, total: true, createdAt: true, updatedAt: true },
    }),
    prisma.adminAuditLog.findMany({
      where: { targetType: 'shop', targetId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, action: true, description: true, createdAt: true, metadata: true, adminId: true },
    }),
  ])

  const activityLog = Array.isArray((shop.features as any)?.activityLog) ? (shop.features as any).activityLog : []

  const events: Array<{
    id: string
    type: string
    title: string
    timestamp: string
    meta?: any
  }> = []

  for (const t of tickets) {
    events.push({
      id: `ticket:${t.id}`,
      type: 'ticket',
      title: `${t.ticketNumber} • ${t.status} • ${t.issueDescription}`,
      timestamp: t.updatedAt.toISOString(),
      meta: { ticketId: t.id, status: t.status, createdAt: t.createdAt.toISOString() },
    })
  }
  for (const inv of invoices) {
    events.push({
      id: `invoice:${inv.id}`,
      type: 'invoice',
      title: `Invoice ${inv.invoiceNumber} • ${inv.status} • $${Number(inv.total).toFixed(2)}`,
      timestamp: inv.updatedAt.toISOString(),
      meta: { invoiceId: inv.id, status: inv.status, createdAt: inv.createdAt.toISOString() },
    })
  }
  for (const a of audit) {
    events.push({
      id: `audit:${a.id}`,
      type: 'admin',
      title: a.description || a.action,
      timestamp: a.createdAt.toISOString(),
      meta: { action: a.action, adminId: a.adminId, metadata: a.metadata },
    })
  }
  for (const e of activityLog.slice(0, 200)) {
    const ts = typeof e?.timestamp === 'string' ? e.timestamp : null
    if (!ts) continue
    events.push({
      id: `ops:${e.id || crypto.randomUUID()}`,
      type: e.type || 'ops',
      title: `${e.userName || 'Staff'} • ${e.type || 'event'}`,
      timestamp: ts,
      meta: e,
    })
  }

  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return NextResponse.json({ shop, events: events.slice(0, 200) })
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

type ActivityType =
  | 'shop_signup'
  | 'shop_suspended'
  | 'shop_reactivated'
  | 'shop_plan_changed'
  | 'payment_received'
  | 'invoice_paid'
  | 'admin_action'

function toIso(d: Date) {
  return d.toISOString()
}

function parseCursor(cursor?: string | null) {
  if (!cursor) return null
  const d = new Date(cursor)
  return Number.isFinite(d.getTime()) ? d : null
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 25)))
  const type = (searchParams.get('type') || '').trim() as ActivityType | ''
  const cursorDate = parseCursor(searchParams.get('cursor'))
  const before = cursorDate || new Date()

  // Defensive: some dev environments may have a stale Prisma client that lacks certain delegates.
  const p: any = prisma as any

  const [shops, payments, audits] = await Promise.all([
    p.shop?.findMany
      ? p.shop.findMany({
          where: { createdAt: { lt: before } },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, name: true, slug: true, createdAt: true, plan: true, status: true },
        })
      : Promise.resolve([]),
    p.invoice?.findMany
      ? p.invoice.findMany({
          where: { createdAt: { lt: before }, status: { in: ['PAID', 'PARTIAL'] } },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountPaid: true,
            paidAt: true,
            createdAt: true,
            shop: { select: { id: true, name: true, slug: true } },
          },
        })
      : Promise.resolve([]),
    p.adminAuditLog?.findMany
      ? p.adminAuditLog.findMany({
          where: { createdAt: { lt: before } },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, action: true, targetType: true, targetId: true, description: true, createdAt: true, metadata: true },
        })
      : Promise.resolve([]),
  ])

  const events: Array<{
    id: string
    type: ActivityType
    title: string
    timestamp: string
    shop?: { id: string; name: string; slug: string }
    link?: string
    meta?: any
  }> = []

  for (const s of shops) {
    events.push({
      id: `shop:${s.id}`,
      type: 'shop_signup',
      title: `New shop signup: ${s.name}`,
      timestamp: toIso(s.createdAt),
      shop: { id: s.id, name: s.name, slug: s.slug },
      link: `/admin/shops/${s.id}`,
      meta: { plan: s.plan, status: s.status },
    })
  }

  for (const p of payments as any[]) {
    events.push({
      id: `invoice:${p.id}`,
      type: 'invoice_paid',
      title: `Invoice paid • $${Number(p.amountPaid ?? p.total).toFixed(2)} • ${p.shop.name}`,
      timestamp: toIso(p.paidAt || p.createdAt),
      shop: { id: p.shop.id, name: p.shop.name, slug: p.shop.slug },
      link: `/admin/shops/${p.shop.id}`,
      meta: { invoiceId: p.id, invoiceNumber: p.invoiceNumber, status: p.status },
    })
  }

  for (const a of audits) {
    const t: ActivityType =
      a.action === 'shop.suspend'
        ? 'shop_suspended'
        : a.action === 'shop.reactivate'
          ? 'shop_reactivated'
          : a.action === 'shop.change_plan'
            ? 'shop_plan_changed'
            : 'admin_action'

    events.push({
      id: `audit:${a.id}`,
      type: t,
      title: a.description || a.action,
      timestamp: toIso(a.createdAt),
      link: a.targetType === 'shop' && a.targetId ? `/admin/shops/${a.targetId}` : '/admin/audit',
      meta: { action: a.action, targetType: a.targetType, targetId: a.targetId, metadata: a.metadata },
    })
  }

  const filtered = (type ? events.filter((e) => e.type === type) : events)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit)

  const nextCursor = filtered.length ? filtered[filtered.length - 1]!.timestamp : null

  return NextResponse.json({ events: filtered, nextCursor })
}


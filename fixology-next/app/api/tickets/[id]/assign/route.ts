// app/api/tickets/[id]/assign/route.ts
// Assign/unassign a technician to a ticket (by tech name).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const techName = typeof body?.techName === 'string' ? body.techName.trim() : ''

  // Verify ticket belongs to shop
  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, shopId: context.shopId },
    select: { id: true },
  })
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  let assignedToId: string | null = null
  if (techName) {
    const tech = await prisma.shopUser.findFirst({
      where: {
        shopId: context.shopId,
        status: 'ACTIVE',
        name: { equals: techName, mode: 'insensitive' },
      },
      select: { id: true },
    })
    if (!tech) {
      return NextResponse.json({ error: `Tech not found: ${techName}` }, { status: 404 })
    }
    assignedToId = tech.id
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: { assignedToId },
    select: { id: true, assignedToId: true },
  })

  return NextResponse.json({ ok: true, ticket: updated })
}


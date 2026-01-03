import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function daysRemaining(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

export async function GET(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

    const digits = q.replace(/\D/g, '')

    const ticket = await prisma.ticket.findFirst({
      where: {
        shopId: context.shopId,
        OR: [
          { ticketNumber: q.toUpperCase() },
          ...(digits
            ? [
                {
                  customer: {
                    phone: { contains: digits },
                  },
                } as any,
              ]
            : []),
        ],
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!ticket) return NextResponse.json({ error: 'No warranty found for this ticket or phone number' }, { status: 404 })

    const repairDate = ticket.completedAt || ticket.repairedAt || ticket.createdAt
    const warrantyPeriod = 90
    const warrantyExpires = new Date(new Date(repairDate).getTime() + warrantyPeriod * 86400000).toISOString()
    const remaining = daysRemaining(warrantyExpires)
    const isActive = remaining > 0

    return NextResponse.json(
      {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        customerName: `${ticket.customer.firstName} ${ticket.customer.lastName}`.trim(),
        customerPhone: ticket.customer.phone,
        repairType: ticket.issueDescription,
        repairDate: new Date(repairDate).toISOString(),
        warrantyPeriod,
        warrantyExpires,
        warrantyType: 'full',
        isActive,
        daysRemaining: remaining,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Warranty lookup error:', error)
    return NextResponse.json({ error: error.message || 'Failed to lookup warranty' }, { status: 500 })
  }
}


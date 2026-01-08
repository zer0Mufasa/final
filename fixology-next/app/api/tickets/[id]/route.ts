import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  const shopId = isPlatformAdmin(context)
    ? context.getShopId(request.nextUrl.searchParams.get('shop_id') ?? undefined)
    : isShopUser(context)
    ? context.shopId
    : null

  if (!shopId) {
    return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, shopId },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        invoice: {
          include: {
            payments: true,
          },
        },
        parts: {
          include: { inventory: true },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket }, { status: 200 })
  } catch (error: any) {
    console.error('Ticket detail error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load ticket' }, { status: 500 })
  }
}

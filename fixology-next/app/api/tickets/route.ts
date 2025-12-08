// app/api/tickets/route.ts
// CRUD operations for tickets with shop isolation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'

// GET /api/tickets - List tickets for the shop
export async function GET(request: NextRequest) {
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

  // Parse query params
  const status = request.nextUrl.searchParams.get('status')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

  try {
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          shopId,
          ...(status ? { status: status as any } : {}),
        },
        include: {
          customer: true,
          assignedTo: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticket.count({
        where: {
          shopId,
          ...(status ? { status: status as any } : {}),
        },
      }),
    ])

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + tickets.length < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const shopId = context.shopId

    // Validate required fields
    if (!body.customerId || !body.deviceType || !body.deviceBrand || !body.issueDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, deviceType, deviceBrand, issueDescription' },
        { status: 400 }
      )
    }

    // Generate ticket number
    const lastTicket = await prisma.ticket.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    })

    const ticketCount = lastTicket
      ? parseInt(lastTicket.ticketNumber.split('-')[1]) + 1
      : 1
    const ticketNumber = `FIX-${ticketCount.toString().padStart(4, '0')}`

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        shopId,
        ticketNumber,
        customerId: body.customerId,
        deviceType: body.deviceType,
        deviceBrand: body.deviceBrand,
        deviceModel: body.deviceModel,
        deviceColor: body.deviceColor,
        imei: body.imei,
        serialNumber: body.serialNumber,
        passcode: body.passcode,
        issueDescription: body.issueDescription,
        symptoms: body.symptoms || [],
        priority: body.priority || 'NORMAL',
        createdById: context.user.id,
        assignedToId: body.assignedToId,
        estimatedCost: body.estimatedCost,
        dueAt: body.dueAt,
      },
      include: {
        customer: true,
        assignedTo: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    // Create initial status history entry
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        toStatus: 'INTAKE',
        changedById: context.user.id,
      },
    })

    // Update customer ticket count
    await prisma.customer.update({
      where: { id: body.customerId },
      data: { ticketCount: { increment: 1 } },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Failed to create ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const shopId = searchParams.get('shopId')
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 50)))

  const where: any = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (shopId) where.shopId = shopId

  const [tickets, totalCount] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            notes: true,
            photos: true,
            parts: true,
          },
        },
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.ticket.count({ where }),
  ])

  // Format dates for JSON serialization
  const formattedTickets = tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    shop: ticket.shop,
    customer: ticket.customer,
    deviceType: ticket.deviceType,
    deviceBrand: ticket.deviceBrand,
    deviceModel: ticket.deviceModel,
    issueDescription: ticket.issueDescription,
    status: ticket.status,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo,
    createdBy: ticket.createdBy,
    estimatedCost: ticket.estimatedCost ? ticket.estimatedCost.toString() : null,
    actualCost: ticket.actualCost ? ticket.actualCost.toString() : null,
    intakeAt: ticket.intakeAt.toISOString(),
    diagnosedAt: ticket.diagnosedAt?.toISOString() || null,
    repairedAt: ticket.repairedAt?.toISOString() || null,
    completedAt: ticket.completedAt?.toISOString() || null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    counts: ticket._count,
  }))

  // Get stats
  const [openCount, pendingCount, resolvedCount] = await prisma.$transaction([
    prisma.ticket.count({
      where: {
        status: {
          in: ['INTAKE', 'DIAGNOSED', 'WAITING_PARTS', 'IN_PROGRESS', 'READY'],
        },
      },
    }),
    prisma.ticket.count({
      where: {
        status: {
          in: ['INTAKE', 'DIAGNOSED', 'WAITING_PARTS'],
        },
      },
    }),
    prisma.ticket.count({
      where: {
        status: 'PICKED_UP',
      },
    }),
  ])

    return NextResponse.json({
      tickets: formattedTickets,
      totalCount,
      stats: {
        open: openCount,
        pending: pendingCount,
        resolved: resolvedCount,
      },
    })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'ticket.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { ticketId, status, priority, assignedToId, note } = body || {}

  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { shop: { select: { name: true } } },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const updateData: any = {}
  if (status) updateData.status = status
  if (priority) updateData.priority = priority
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null

  // Update status timestamps
  if (status === 'DIAGNOSED' && !ticket.diagnosedAt) {
    updateData.diagnosedAt = new Date()
  }
  if (status === 'READY' && !ticket.repairedAt) {
    updateData.repairedAt = new Date()
  }
  if (status === 'PICKED_UP' && !ticket.completedAt) {
    updateData.completedAt = new Date()
    updateData.pickedUpAt = new Date()
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: updateData,
  })

  // Add status history if status changed
  if (status && status !== ticket.status) {
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: ticket.status,
        toStatus: status,
        changedById: admin.id, // Using admin ID, but this should ideally be a ShopUser ID
        note: note || `Status changed by admin ${admin.name}`,
      },
    })
  }

  // Add note if provided
  if (note) {
    await prisma.ticketNote.create({
      data: {
        ticketId,
        userId: admin.id, // Using admin ID
        content: note,
        isInternal: true,
      },
    })
  }

  await logAdminAction(
    admin,
    'ticket.update',
    'ticket',
    ticketId,
    `Updated ticket ${ticket.ticketNumber} in shop ${ticket.shop.name}`,
    { status, priority, assignedToId },
    request
  )

  return NextResponse.json({ ticket: updatedTicket })
}

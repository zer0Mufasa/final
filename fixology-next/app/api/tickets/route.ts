// app/api/tickets/route.ts
// CRUD operations for tickets with shop isolation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'
import { sendTicketCreatedEmail } from '@/lib/email/send'

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

    // Support both direct creation and draft-based creation
    let customerId = body.customerId
    let draft = body.draft || null

    // If draft is provided, create/upsert customer first
    if (draft && draft.customer) {
      const customerData = draft.customer
      
      // Normalize phone number (remove formatting, keep only digits)
      const normalizedPhone = customerData.phone 
        ? customerData.phone.replace(/\D/g, '') 
        : null
      
      // Try to find existing customer by phone or email (with normalized phone)
      if (normalizedPhone || customerData.email) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            shopId,
            OR: [
              ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
              ...(customerData.email ? [{ email: customerData.email }] : []),
            ],
          },
        })

        if (existingCustomer) {
          customerId = existingCustomer.id
          // Update customer info if provided
          const updateData: any = {}
          if (customerData.firstName) updateData.firstName = customerData.firstName
          if (customerData.lastName) updateData.lastName = customerData.lastName
          if (normalizedPhone) updateData.phone = normalizedPhone
          if (customerData.email) updateData.email = customerData.email
          
          if (Object.keys(updateData).length > 0) {
            await prisma.customer.update({
              where: { id: customerId },
              data: updateData,
            })
          }
        } else {
          // Create new customer with normalized phone
          const newCustomer = await prisma.customer.create({
            data: {
              shopId,
              firstName: customerData.firstName || 'Unknown',
              lastName: customerData.lastName || 'Customer',
              phone: normalizedPhone,
              email: customerData.email,
            },
          })
          customerId = newCustomer.id
        }
      } else {
        // No phone/email, try to find by name match (fuzzy match)
        if (customerData.firstName && customerData.lastName) {
          const nameMatch = await prisma.customer.findFirst({
            where: {
              shopId,
              firstName: { contains: customerData.firstName, mode: 'insensitive' },
              lastName: { contains: customerData.lastName, mode: 'insensitive' },
            },
          })
          
          if (nameMatch) {
            customerId = nameMatch.id
            // Update phone/email if provided
            if (normalizedPhone || customerData.email) {
              await prisma.customer.update({
                where: { id: customerId },
                data: {
                  ...(normalizedPhone && { phone: normalizedPhone }),
                  ...(customerData.email && { email: customerData.email }),
                },
              })
            }
          } else {
            // Create new customer
            const newCustomer = await prisma.customer.create({
              data: {
                shopId,
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                phone: normalizedPhone,
                email: customerData.email,
              },
            })
            customerId = newCustomer.id
          }
        } else {
          // Create anonymous customer
          const newCustomer = await prisma.customer.create({
            data: {
              shopId,
              firstName: customerData.firstName || 'Unknown',
              lastName: customerData.lastName || 'Customer',
              phone: normalizedPhone,
              email: customerData.email,
            },
          })
          customerId = newCustomer.id
        }
      }
    }

    // Validate required fields
    if (!customerId || (!body.deviceType && !draft?.device?.type) || (!body.deviceBrand && !draft?.device?.brand) || (!body.issueDescription && !draft?.issue)) {
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

    // Use draft data if available, otherwise use direct body data
    const deviceType = body.deviceType || draft?.device?.type || ''
    const deviceBrand = body.deviceBrand || draft?.device?.brand || ''
    const deviceModel = body.deviceModel || draft?.device?.model
    const deviceColor = body.deviceColor || draft?.device?.color
    const issueDescription = body.issueDescription || draft?.issue || ''
    const priority = body.priority || draft?.priority || 'NORMAL'
    const estimatedCost = body.estimatedCost || (draft?.estimatedPriceRange ? draft.estimatedPriceRange.max : null)
    const passcode = body.passcode || draft?.passcode

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        shopId,
        ticketNumber,
        customerId,
        deviceType,
        deviceBrand,
        deviceModel,
        deviceColor,
        imei: body.imei,
        serialNumber: body.serialNumber,
        passcode: passcode,
        issueDescription,
        symptoms: body.symptoms || [],
        priority,
        createdById: context.user.id,
        assignedToId: body.assignedToId,
        estimatedCost,
        dueAt: body.dueAt,
        aiDraft: draft ? JSON.parse(JSON.stringify(draft)) : null, // Store draft as JSON
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

    // Create intake note with AI draft info if available
    if (draft) {
      await prisma.ticketNote.create({
        data: {
          ticketId: ticket.id,
          userId: context.user.id,
          content: `AI Intake Note (${draft.confidence?.overall || 0}% confidence):\n${draft.issue}\n\n${draft.riskFlags && draft.riskFlags.length > 0 ? `Risk Flags: ${draft.riskFlags.join(', ')}\n` : ''}${draft.carrier ? `Carrier: ${draft.carrier}\n` : ''}${draft.suggestedParts && draft.suggestedParts.length > 0 ? `Suggested Parts: ${draft.suggestedParts.join(', ')}` : ''}`,
          isInternal: false, // Customer-visible note
        },
      })
    }

    // Update customer ticket count
    await prisma.customer.update({
      where: { id: customerId },
      data: { ticketCount: { increment: 1 } },
    })

    // Best-effort: customer notification (does not block ticket creation).
    try {
      const customerEmail = ticket.customer?.email
      if (customerEmail) {
        const shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { name: true },
        })
        const customerName = [ticket.customer?.firstName, ticket.customer?.lastName].filter(Boolean).join(' ') || 'there'
        await sendTicketCreatedEmail(customerEmail, {
          customerName,
          ticketNumber: ticket.ticketNumber,
          deviceType: ticket.deviceType,
          deviceBrand: ticket.deviceBrand,
          issueSummary: ticket.issueDescription,
          shopName: shop?.name || 'Fixology Repair Shop',
          dashboardUrl: undefined,
        })
      }
    } catch {
      // ignore
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Failed to create ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}


// Support Tickets API - shop users can file tickets to platform support

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/send'

const CreateSupportTicketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  category: z.enum(['bug', 'billing', 'feature', 'account', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
})

// GET /api/support/tickets - List support tickets for the shop
export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    // Support tickets are stored in shop.features JSON for simplicity
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })

    const supportTickets = (shop?.features as any)?.supportTickets || []

    return NextResponse.json(supportTickets, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}

// POST /api/support/tickets - Create a support ticket
export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const data = CreateSupportTicketSchema.parse(await request.json())

    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })

    const existingTickets = (shop?.features as any)?.supportTickets || []

    const ticketId = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const newTicket = {
      id: ticketId,
      ...data,
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: context.user.id,
    }

    const updatedTickets = [newTicket, ...existingTickets]

    await prisma.shop.update({
      where: { id: context.shopId },
      data: {
        features: {
          ...(shop?.features as object || {}),
          supportTickets: updatedTickets,
        },
      },
    })

    // Best-effort: notify internal support (does not block ticket creation).
    const supportTo = process.env.SUPPORT_TO || process.env.CONTACT_TO
    const supportFrom = process.env.SUPPORT_FROM || process.env.CONTACT_FROM
    if (supportTo) {
      const summary = [
        `Ticket: ${ticketId}`,
        `Shop: ${context.shopId}`,
        `From: ${data.name} <${data.email}>`,
        `Category: ${data.category}`,
        `Priority: ${data.priority}`,
        `Title: ${data.title}`,
        '',
        data.message,
      ].join('\n')

      await sendEmail({
        to: supportTo,
        from: supportFrom || undefined,
        replyTo: data.email,
        subject: `[Fixology Support] ${ticketId} • ${data.title}`,
        text: summary,
        tags: [
          { name: 'type', value: 'support_ticket' },
          { name: 'ticket', value: ticketId },
          { name: 'shopId', value: context.shopId },
        ],
      })
    }

    // Best-effort: confirmation to the submitter (only if email is configured).
    await sendEmail({
      to: data.email,
      subject: `We received your support ticket (${ticketId})`,
      text: [
        `Hi ${data.name},`,
        '',
        `We received your support request: ${data.title}`,
        `Ticket ID: ${ticketId}`,
        '',
        'We’ll follow up as soon as possible.',
        '',
        '— Fixology Support',
      ].join('\n'),
      tags: [
        { name: 'type', value: 'support_ticket_confirmation' },
        { name: 'ticket', value: ticketId },
      ],
    })

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating support ticket:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}

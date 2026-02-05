// app/api/messages/send/route.ts
// Automated customer messaging service

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'
import { sendDeviceReadyEmail, sendEmail } from '@/lib/email/send'

const statusTemplates: Record<string, { subject: (ticket: any) => string; body: (ticket: any) => string }> = {
  INTAKE: {
    subject: () => 'Your repair ticket has been received',
    body: (ticket) => `Hi ${ticket.customer.firstName || 'there'},

We've received your repair request for ${ticket.deviceBrand} ${ticket.deviceType}.

Ticket Number: ${ticket.ticketNumber}
Issue: ${ticket.issueDescription}

We'll review your device and get back to you soon.

Thank you for choosing us!`,
  },
  DIAGNOSED: {
    subject: (ticket: any) => `Diagnosis complete for ${ticket.ticketNumber}`,
    body: (ticket) => `Hi ${ticket.customer.firstName || 'there'},

We've completed the diagnosis for your ${ticket.deviceBrand} ${ticket.deviceType}.

Ticket Number: ${ticket.ticketNumber}
${ticket.diagnosis ? `Diagnosis: ${ticket.diagnosis}` : ''}
${ticket.estimatedCost ? `Estimated Cost: $${ticket.estimatedCost}` : ''}

Please let us know if you'd like to proceed with the repair.

Thank you!`,
  },
  IN_PROGRESS: {
    subject: (ticket: any) => `Repair in progress - ${ticket.ticketNumber}`,
    body: (ticket) => `Hi ${ticket.customer.firstName || 'there'},

We've started working on your ${ticket.deviceBrand} ${ticket.deviceType}.

Ticket Number: ${ticket.ticketNumber}

We'll keep you updated on the progress.

Thank you!`,
  },
  READY: {
    subject: (ticket: any) => `Your device is ready for pickup - ${ticket.ticketNumber}`,
    body: (ticket) => `Hi ${ticket.customer.firstName || 'there'},

Great news! Your ${ticket.deviceBrand} ${ticket.deviceType} is ready for pickup.

Ticket Number: ${ticket.ticketNumber}
${ticket.actualCost ? `Total Cost: $${ticket.actualCost}` : ''}

Please come by during our business hours to pick it up.

Thank you!`,
  },
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const { ticketId, message, channel = 'email' } = await request.json()

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 })
    }

    // Get ticket with customer info
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        shopId: context.shopId,
      },
      include: {
        customer: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Use custom message or template based on status
    let subject = 'Update on your repair'
    let body = message

    if (!message && ticket.status in statusTemplates) {
      const template = statusTemplates[ticket.status]
      subject = template.subject(ticket)
      body = template.body(ticket)
    }

    // Send email if customer has email
    if (channel === 'email' && ticket.customer.email) {
      try {
        if (!message && ticket.status === 'READY') {
          const shop = await prisma.shop.findUnique({
            where: { id: context.shopId },
            select: { name: true, phone: true, address: true, city: true, state: true, zip: true },
          })
          const addr = [shop?.address, [shop?.city, shop?.state].filter(Boolean).join(', '), shop?.zip]
            .filter(Boolean)
            .join(' ')

          const customerName =
            [ticket.customer.firstName, ticket.customer.lastName].filter(Boolean).join(' ') || 'there'

          await sendDeviceReadyEmail(ticket.customer.email, {
            customerName,
            deviceType: `${ticket.deviceBrand} ${ticket.deviceType}`.trim(),
            ticketId: ticket.ticketNumber,
            shopName: shop?.name || 'Your repair shop',
            shopPhone: shop?.phone || '',
            shopAddress: addr,
            pickupUrl: undefined,
          })
        } else {
          await sendEmail({
            to: ticket.customer.email,
            subject,
            text: body,
            tags: [
              { name: 'type', value: 'ticket_status' },
              { name: 'ticket', value: ticket.ticketNumber },
              { name: 'shopId', value: context.shopId },
            ],
          })
        }
      } catch (emailError: any) {
        console.error('Failed to send email:', emailError)
        // Continue even if email fails
      }
    }

    // TODO: Add SMS via Twilio when configured
    // if (channel === 'sms' && ticket.customer.phone) { ... }

    // Store message in database
    await prisma.message.create({
      data: {
        shopId: context.shopId,
        customerId: ticket.customerId,
        direction: 'OUTBOUND',
        channel: channel === 'email' ? 'EMAIL' : 'SMS',
        content: `${subject}\n\n${body}`,
        sentAt: new Date(),
        status: 'SENT',
      },
    })

    return NextResponse.json({ success: true, message: 'Message sent' })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}


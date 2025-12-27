// app/api/tickets/[id]/status/route.ts
// API route to update ticket status

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Verify user has access to this ticket
    const shopUser = await prisma.shopUser.findFirst({
      where: {
        email: session.user.email!,
        status: 'ACTIVE',
      },
    })

    if (!shopUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: params.id,
        shopId: shopUser.shopId,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Update ticket status
    const updated = await prisma.ticket.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json({ success: true, ticket: updated })
  } catch (error: any) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket status' },
      { status: 500 }
    )
  }
}


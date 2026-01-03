// Time Tracking API - single entry operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'

// PATCH /api/time-tracking/[id] - Update time entry
const UpdateTimeEntrySchema = z.object({
  clockIn: z.string().optional(),
  clockOut: z.string().optional().nullable(),
  breakMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})

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

  try {
    const data = UpdateTimeEntrySchema.parse(await request.json())

    // Verify the entry belongs to a shop user
    const entry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!entry || entry.user.shopId !== context.shopId) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        clockIn: data.clockIn ? new Date(data.clockIn) : undefined,
        clockOut: data.clockOut ? new Date(data.clockOut) : data.clockOut === null ? null : undefined,
        breakMinutes: data.breakMinutes,
        notes: data.notes,
      },
    })

    return NextResponse.json({ success: true, entry: updated }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating time entry:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update time entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-tracking/[id] - Delete time entry
export async function DELETE(
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

  try {
    // Verify the entry belongs to a shop user
    const entry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!entry || entry.user.shopId !== context.shopId) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}

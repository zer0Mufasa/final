// Staff API - single staff member operations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'

// PATCH /api/staff/[id] - Update staff member
const UpdateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'TECHNICIAN', 'FRONT_DESK']).optional(),
  isActive: z.boolean().optional(),
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

  // Only owners/managers can edit staff
  if (!['OWNER', 'MANAGER'].includes(context.user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const data = UpdateStaffSchema.parse(await request.json())

    const staff = await prisma.shopUser.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const updated = await prisma.shopUser.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role as any,
        ...(data.isActive !== undefined
          ? { status: data.isActive ? 'ACTIVE' : 'DISABLED' }
          : {}),
      },
    })

    return NextResponse.json({ success: true, staff: updated }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating staff:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update staff' },
      { status: 500 }
    )
  }
}

// DELETE /api/staff/[id] - Deactivate staff member
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

  // Only owners can delete staff
  if (context.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only owners can deactivate staff' }, { status: 403 })
  }

  try {
    const staff = await prisma.shopUser.findFirst({
      where: { id: params.id, shopId: context.shopId },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Don't delete, just deactivate
    await prisma.shopUser.update({
      where: { id: params.id },
      data: { status: 'DISABLED' },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deactivating staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate staff' },
      { status: 500 }
    )
  }
}

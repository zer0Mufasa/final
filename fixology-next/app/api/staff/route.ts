// Staff API - list and manage shop users

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'

// GET /api/staff - List all staff for the shop
export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const staff = await prisma.shopUser.findMany({
      where: { shopId: context.shopId },
      orderBy: { name: 'asc' },
    })

    // Get stats for each staff member from tickets
    const staffWithStats = await Promise.all(
      staff.map(async (s) => {
        const [ticketsCompleted, ticketsAssigned] = await Promise.all([
          prisma.ticket.count({
            where: {
              shopId: context.shopId,
              assignedToId: s.id,
              status: { in: ['READY', 'PICKED_UP'] },
            },
          }),
          prisma.ticket.count({
            where: {
              shopId: context.shopId,
              assignedToId: s.id,
              status: { notIn: ['READY', 'PICKED_UP', 'CANCELLED'] },
            },
          }),
        ])

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role.toLowerCase(),
          isActive: s.status === 'ACTIVE',
          createdAt: s.createdAt.toISOString(),
          stats: {
            ticketsCompleted,
            ticketsAssigned,
          },
        }
      })
    )

    return NextResponse.json(staffWithStats, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// POST /api/staff - Create a new staff member
const CreateStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['OWNER', 'MANAGER', 'TECHNICIAN', 'FRONT_DESK']),
})

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  // Only owners/managers can add staff
  if (!['OWNER', 'MANAGER'].includes(context.user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const data = CreateStaffSchema.parse(await request.json())

    // Check if email already exists
    const existing = await prisma.shopUser.findFirst({
      where: {
        shopId: context.shopId,
        email: data.email,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const newStaff = await prisma.shopUser.create({
      data: {
        shopId: context.shopId,
        name: data.name,
        email: data.email,
        role: data.role as any,
        // Minimal placeholder for invited accounts (set real password during invite flow)
        passwordHash: 'invited',
        status: 'INVITED',
      },
    })

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating staff:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create staff' },
      { status: 500 }
    )
  }
}

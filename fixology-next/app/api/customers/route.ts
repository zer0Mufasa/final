// app/api/customers/route.ts
// CRUD operations for customers with shop isolation

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'

// GET /api/customers - List customers for the shop
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
  const search = request.nextUrl.searchParams.get('search')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

  try {
    const where = {
      shopId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + customers.length < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/customers - Create a new customer
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
    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, phone' },
        { status: 400 }
      )
    }

    // Check for existing customer with same phone in this shop
    const existing = await prisma.customer.findFirst({
      where: {
        shopId,
        phone: body.phone,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists', existing },
        { status: 409 }
      )
    }

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        shopId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip,
        notes: body.notes,
        tags: body.tags || [],
        isVip: body.isVip || false,
        smsOptIn: body.smsOptIn ?? true,
        emailOptIn: body.emailOptIn ?? true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Failed to create customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}


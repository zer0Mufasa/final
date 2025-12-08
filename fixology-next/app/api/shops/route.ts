// app/api/shops/route.ts
// Admin operations for shops

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isPlatformAdmin } from '@/lib/auth/get-shop-context'

// GET /api/shops - List all shops (admin only)
export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isPlatformAdmin(context)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Parse query params
  const status = request.nextUrl.searchParams.get('status')
  const plan = request.nextUrl.searchParams.get('plan')
  const search = request.nextUrl.searchParams.get('search')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0')

  try {
    const where = {
      ...(status ? { status: status as any } : {}),
      ...(plan ? { plan: plan as any } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        include: {
          users: {
            where: { role: 'OWNER' },
            take: 1,
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { tickets: true, customers: true, users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.shop.count({ where }),
    ])

    return NextResponse.json({
      shops,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + shops.length < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch shops:', error)
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
  }
}


// app/api/customers/check/route.ts
// Check if customer exists by phone or email

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    if (!phone && !email) {
      return NextResponse.json({ found: false })
    }

    // Normalize phone (remove formatting)
    const normalizedPhone = phone ? phone.replace(/\D/g, '') : null

    const customer = await prisma.customer.findFirst({
      where: {
        shopId: context.shopId,
        OR: [
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    if (customer) {
      return NextResponse.json({
        found: true,
        name: `${customer.firstName} ${customer.lastName}`,
      })
    }

    return NextResponse.json({ found: false })
  } catch (error: any) {
    console.error('Customer check error:', error)
    return NextResponse.json({ found: false })
  }
}


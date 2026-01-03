// app/api/me/preferences/route.ts
// Store per-user UI preferences (and a couple dashboard toggles) in shop_users.permissions JSON.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

type Prefs = Record<string, any>

export async function GET() {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const user = await prisma.shopUser.findUnique({
    where: { id: context.user.id },
    select: { permissions: true },
  })

  return NextResponse.json({ preferences: (user?.permissions as Prefs) ?? {} })
}

export async function PATCH(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }
  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  const patch = (await request.json().catch(() => null)) as Prefs | null
  if (!patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const current = await prisma.shopUser.findUnique({
    where: { id: context.user.id },
    select: { permissions: true },
  })

  const merged: Prefs = {
    ...(current?.permissions as Prefs),
    ...patch,
  }

  const updated = await prisma.shopUser.update({
    where: { id: context.user.id },
    data: { permissions: merged },
    select: { permissions: true },
  })

  return NextResponse.json({ preferences: updated.permissions ?? {} })
}


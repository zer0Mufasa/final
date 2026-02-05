// app/api/me/route.ts
// Get current user and shop information

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isPlatformAdmin, isShopUser } from '@/lib/auth/get-shop-context'

export async function GET(request: NextRequest) {
  // Demo mode: allow dashboard to load without Supabase/DB.
  if (request.cookies.get('fx_demo')?.value === '1') {
    return NextResponse.json({
      type: 'shop_user',
      user: { id: 'demo', name: 'Demo User', email: 'demo@fixology.local', role: 'OWNER', shopId: 'demo' },
      shop: { id: 'demo', name: 'Demo Shop', plan: 'PRO', status: 'ACTIVE', features: { demo: true } },
    })
  }

  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (isPlatformAdmin(context)) {
    return NextResponse.json({
      type: 'platform_admin',
      user: context.admin,
    })
  }

  if (isShopUser(context)) {
    return NextResponse.json({
      type: 'shop_user',
      user: context.user,
      shop: context.shop,
    })
  }

  return NextResponse.json({ error: 'Unknown context' }, { status: 500 })
}


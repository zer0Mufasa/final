import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

export const runtime = 'nodejs'

export async function POST() {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ ok: false, error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ ok: false, error: 'Shop user required' }, { status: 403 })
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })

    const features = (shop?.features ?? {}) as any
    const nextFeatures = { ...features, onboarding_step: 5 }

    await prisma.shop.update({
      where: { id: context.shopId },
      data: {
        onboardingCompletedAt: new Date(),
        features: nextFeatures,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}



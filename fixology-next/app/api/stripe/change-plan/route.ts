// app/api/stripe/change-plan/route.ts
// Upgrade/Downgrade subscription plan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { getStripeServer } from '@/lib/stripe/server'
import { PLANS } from '@/lib/stripe/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { shopId, newPlanId } = body

    if (!newPlanId || !['STARTER', 'PRO'].includes(newPlanId)) {
      return NextResponse.json({ error: 'Invalid plan. Use STARTER or PRO.' }, { status: 400 })
    }

    // Get shop for user
    const shopUser = await prisma.shopUser.findFirst({
      where: { email: session.user.email, status: 'ACTIVE' },
      include: { shop: true },
    })

    const shop = shopId
      ? await prisma.shop.findUnique({ where: { id: shopId } })
      : shopUser?.shop

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (!shop.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription. Please subscribe first.' },
        { status: 400 }
      )
    }

    const newPlan = newPlanId === 'STARTER' ? PLANS.STARTER : PLANS.PROFESSIONAL

    // Get current subscription
    const stripe = getStripeServer()
    const subscription = await stripe.subscriptions.retrieve(shop.stripeSubscriptionId)

    // Update subscription to new plan
    const updatedSubscription = await stripe.subscriptions.update(shop.stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPlan.priceId,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        ...subscription.metadata,
        planId: newPlanId,
      },
    })

    // Update database
    const dbPlan = newPlanId === 'STARTER' ? 'STARTER' : 'PRO'
    await prisma.shop.update({
      where: { id: shop.id },
      data: { plan: dbPlan },
    })

    return NextResponse.json({
      success: true,
      newPlan: newPlanId,
      message: `Successfully changed to ${newPlan.name}`,
    })
  } catch (error: any) {
    console.error('Change plan error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to change plan' },
      { status: 500 }
    )
  }
}

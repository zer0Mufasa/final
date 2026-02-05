// app/api/stripe/subscription/route.ts
// Get subscription status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { getStripeServer } from '@/lib/stripe/server'
import { PLANS } from '@/lib/stripe/plans'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapStripeSubscriptionStatusToShopStatus(status: Stripe.Subscription.Status) {
  if (status === 'trialing') return 'TRIAL' as const
  if (status === 'active') return 'ACTIVE' as const
  if (status === 'past_due' || status === 'unpaid') return 'PAST_DUE' as const
  if (status === 'canceled') return 'CANCELLED' as const
  if (status === 'incomplete' || status === 'incomplete_expired' || status === 'paused') return 'SUSPENDED' as const
  return 'SUSPENDED' as const
}

function toDateFromUnixSeconds(sec?: number | null) {
  if (!sec) return null
  return new Date(sec * 1000)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = req.nextUrl.searchParams.get('shopId')

    // Get shop for user
    const shopUser = await prisma.shopUser.findFirst({
      where: { email: session.user.email, status: 'ACTIVE' },
      include: {
        shop: {
          // Avoid selecting columns that may not exist yet in production (e.g. imei_credits).
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            status: true,
            trialEndsAt: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            features: true,
          },
        },
      },
    })

    const shop = shopId
      ? await prisma.shop.findUnique({ where: { id: shopId } })
      : shopUser?.shop

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // If no subscription, return basic info
    if (!shop.stripeSubscriptionId) {
      return NextResponse.json({
        hasSubscription: false,
        plan: shop.plan,
        status: shop.status,
      })
    }

    // Get subscription from Stripe
    const stripe = getStripeServer()
    const subscription = await stripe.subscriptions.retrieve(shop.stripeSubscriptionId)

    // Best-effort sync: if webhook wasn't configured or missed events, keep our DB in sync.
    try {
      const nextStatus = mapStripeSubscriptionStatusToShopStatus(subscription.status)
      const nextTrialEndsAt = toDateFromUnixSeconds(subscription.trial_end || null)

      const priceId = subscription.items?.data?.[0]?.price?.id
      const nextPlan =
        priceId && process.env.STRIPE_PRICE_STARTER && priceId === process.env.STRIPE_PRICE_STARTER
          ? 'STARTER'
          : priceId && process.env.STRIPE_PRICE_PROFESSIONAL && priceId === process.env.STRIPE_PRICE_PROFESSIONAL
            ? 'PRO'
            : undefined

      const needsUpdate =
        shop.status !== nextStatus ||
        String(shop.trialEndsAt || '') !== String(nextTrialEndsAt || '') ||
        (nextPlan && shop.plan !== nextPlan) ||
        (typeof subscription.customer === 'string' && shop.stripeCustomerId !== subscription.customer) ||
        shop.stripeSubscriptionId !== subscription.id

      if (needsUpdate) {
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            status: nextStatus,
            trialEndsAt: nextTrialEndsAt,
            ...(nextPlan ? { plan: nextPlan as any } : {}),
            stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as any)?.id,
            stripeSubscriptionId: subscription.id,
          },
        })
      }
    } catch {
      // ignore sync errors (subscription endpoint should still respond)
    }

    const planKey = shop.plan === 'STARTER' ? 'STARTER' : shop.plan === 'PRO' ? 'PROFESSIONAL' : null
    const planDetails = planKey ? PLANS[planKey] : null

    return NextResponse.json({
      hasSubscription: true,
      plan: shop.plan,
      planDetails: planDetails
        ? {
            name: planDetails.name,
            price: planDetails.price,
            features: planDetails.features,
          }
        : null,
      status: shop.status,
      stripeStatus: subscription.status,
      // Stripe TS typings in this repo's installed version don't expose `current_period_end` on Subscription.
      // It exists at runtime; we fall back to the first item's period end if needed.
      currentPeriodEnd: new Date(
        (((subscription as any).current_period_end as number | undefined) ??
          subscription.items?.data?.[0]?.current_period_end ??
          0) * 1000
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

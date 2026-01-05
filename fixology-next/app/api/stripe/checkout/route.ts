import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { getStripeServer } from '@/lib/stripe/server'
import { getPriceIdForPlan, getTrialDays, type StripeCheckoutPlan } from '@/lib/stripe/plans'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSiteUrl(req: Request) {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: Request) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const plan = (body?.plan as StripeCheckoutPlan | undefined)?.toLowerCase() as StripeCheckoutPlan | undefined

  if (!plan || !['starter', 'professional', 'enterprise'].includes(plan)) {
    return NextResponse.json(
      { error: 'Invalid plan. Use starter, professional, or enterprise.' },
      { status: 400 }
    )
  }

  if (plan === 'enterprise') {
    return NextResponse.json(
      { error: 'Enterprise is contact-sales only.', contactSales: true },
      { status: 400 }
    )
  }

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

  if (!shopUser?.shop) {
    return NextResponse.json({ error: 'Shop not found for user.' }, { status: 404 })
  }

  const stripe = getStripeServer()

  // Create Stripe customer tied to shop if missing
  let stripeCustomerId = shopUser.shop.stripeCustomerId || null
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: shopUser.shop.email || session.user.email,
      name: shopUser.shop.name,
      metadata: {
        shopId: shopUser.shop.id,
      },
    })
    stripeCustomerId = customer.id
    await prisma.shop.update({
      where: { id: shopUser.shop.id },
      data: { stripeCustomerId },
    })
  }

  const siteUrl = getSiteUrl(req)
  const trialDays = getTrialDays(plan)
  const priceId = getPriceIdForPlan(plan)

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    client_reference_id: shopUser.shop.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${siteUrl}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/onboarding?checkout=cancelled`,
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        shopId: shopUser.shop.id,
        plan,
      },
    },
    metadata: {
      shopId: shopUser.shop.id,
      plan,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}



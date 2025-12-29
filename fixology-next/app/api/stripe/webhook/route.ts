import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma/client'
import { getStripeServer } from '@/lib/stripe/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

function toDateFromUnixSeconds(sec?: number | null) {
  if (!sec) return null
  return new Date(sec * 1000)
}

function mapStripeSubscriptionStatusToShopStatus(status: Stripe.Subscription.Status) {
  if (status === 'trialing') return 'TRIAL' as const
  if (status === 'active') return 'ACTIVE' as const
  if (status === 'past_due' || status === 'unpaid') return 'PAST_DUE' as const
  if (status === 'canceled') return 'CANCELLED' as const
  if (status === 'incomplete' || status === 'incomplete_expired' || status === 'paused') return 'SUSPENDED' as const
  return 'SUSPENDED' as const
}

async function findShopIdFromEvent(obj: any): Promise<string | null> {
  const metaShopId = obj?.metadata?.shopId
  if (typeof metaShopId === 'string' && metaShopId.length > 0) return metaShopId
  const clientRef = obj?.client_reference_id
  if (typeof clientRef === 'string' && clientRef.length > 0) return clientRef

  const customerId = obj?.customer
  if (typeof customerId === 'string' && customerId.length > 0) {
    const shop = await prisma.shop.findFirst({ where: { stripeCustomerId: customerId } })
    if (shop) return shop.id
  }

  return null
}

export async function POST(req: Request) {
  const stripe = getStripeServer()
  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message || 'unknown'}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const shopId = await findShopIdFromEvent(session)
        if (!shopId) break

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

        let dbPlan: 'STARTER' | 'PRO' | undefined
        const planMeta = (session.metadata?.plan || '') as string
        if (planMeta === 'starter') dbPlan = 'STARTER'
        if (planMeta === 'professional') dbPlan = 'PRO'

        // Best-effort: retrieve subscription to set accurate status/trial immediately.
        let status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | undefined
        let trialEndsAt: Date | null | undefined
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          status = mapStripeSubscriptionStatusToShopStatus(sub.status)
          const trialEnd = toDateFromUnixSeconds(sub.trial_end || null)
          trialEndsAt = trialEnd ?? null

          const priceId = sub.items.data[0]?.price?.id
          if (priceId && process.env.STRIPE_PRICE_STARTER && priceId === process.env.STRIPE_PRICE_STARTER) dbPlan = 'STARTER'
          if (priceId && process.env.STRIPE_PRICE_PROFESSIONAL && priceId === process.env.STRIPE_PRICE_PROFESSIONAL) dbPlan = 'PRO'
        }

        await prisma.shop.update({
          where: { id: shopId },
          data: {
            stripeCustomerId: customerId || undefined,
            stripeSubscriptionId: subscriptionId || undefined,
            ...(typeof status !== 'undefined' ? { status } : {}),
            ...(typeof trialEndsAt !== 'undefined' ? { trialEndsAt } : {}),
            ...(dbPlan ? { plan: dbPlan } : {}),
          },
        })
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const shopId = await findShopIdFromEvent(sub)
        if (!shopId) break

        // Determine plan from subscription price id
        const firstItem = sub.items.data[0]
        const priceId = firstItem?.price?.id
        let dbPlan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' | undefined = undefined
        if (priceId && process.env.STRIPE_PRICE_STARTER && priceId === process.env.STRIPE_PRICE_STARTER) {
          dbPlan = 'STARTER'
        } else if (priceId && process.env.STRIPE_PRICE_PROFESSIONAL && priceId === process.env.STRIPE_PRICE_PROFESSIONAL) {
          dbPlan = 'PRO'
        }

        const shopStatus = mapStripeSubscriptionStatusToShopStatus(sub.status)
        const trialEndsAt = toDateFromUnixSeconds(sub.trial_end || null)

        await prisma.shop.update({
          where: { id: shopId },
          data: {
            stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
            stripeSubscriptionId: sub.id,
            status: shopStatus,
            ...(trialEndsAt ? { trialEndsAt } : { trialEndsAt: null }),
            ...(dbPlan ? { plan: dbPlan } : {}),
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const shopId = await findShopIdFromEvent(invoice)
        if (!shopId) break
        await prisma.shop.update({
          where: { id: shopId },
          data: {
            status: 'PAST_DUE',
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const shopId = await findShopIdFromEvent(invoice)
        if (!shopId) break

        // If subscription exists and is active, mark ACTIVE (Stripe will also send subscription.updated)
        await prisma.shop.update({
          where: { id: shopId },
          data: { status: 'ACTIVE' },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Webhook handler error' }, { status: 500 })
  }
}



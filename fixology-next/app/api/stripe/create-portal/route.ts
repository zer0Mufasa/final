// app/api/stripe/create-portal/route.ts
// Stripe Customer Portal - Manage billing

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { getStripeServer } from '@/lib/stripe/server'

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
    const shopId = body?.shopId

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

    if (!shop.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const stripe = getStripeServer()
    const siteUrl = getSiteUrl(req)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: shop.stripeCustomerId,
      return_url: `${siteUrl}/dashboard/settings/billing`,
      configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to open billing portal' },
      { status: 500 }
    )
  }
}

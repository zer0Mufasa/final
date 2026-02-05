import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { sendEmail } from '@/lib/email/send'
import { getStripeServer } from '@/lib/stripe/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bool(v: any) {
  return Boolean(v)
}

function stripeMode(secretKey?: string) {
  if (!secretKey) return 'unknown'
  if (secretKey.startsWith('sk_test_')) return 'test'
  if (secretKey.startsWith('sk_live_')) return 'live'
  return 'unknown'
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

async function canFetchPage(origin: string, path: string) {
  try {
    const res = await fetch(`${origin}${path}`, { cache: 'no-store', redirect: 'follow' })
    return { ok: res.ok, status: res.status }
  } catch (e: any) {
    return { ok: false, status: 0, error: String(e?.message || e) }
  }
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
  const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || ''
  const STRIPE_PRICE_PROFESSIONAL = process.env.STRIPE_PRICE_PROFESSIONAL || ''
  const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
  const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || ''

  const stripeKeysConfigured = bool(STRIPE_SECRET_KEY)
  const stripeWebhookSecretSet = bool(STRIPE_WEBHOOK_SECRET)
  const stripePriceStarterSet = bool(STRIPE_PRICE_STARTER)
  const stripePriceProfessionalSet = bool(STRIPE_PRICE_PROFESSIONAL)
  const resendApiKeySet = bool(RESEND_API_KEY)
  const sentryDsnConfigured = bool(SENTRY_DSN)

  // Stripe deep checks (optional): verify price IDs exist and webhook endpoint is registered.
  const expectedWebhookUrl = `${normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin)
  )}/api/stripe/webhook`

  let stripePriceChecks: {
    starter: { envSet: boolean; exists: boolean | null; liveMode: boolean | null; error?: string }
    professional: { envSet: boolean; exists: boolean | null; liveMode: boolean | null; error?: string }
    modeMatchesPrices: boolean | null
  } = {
    starter: { envSet: stripePriceStarterSet, exists: null, liveMode: null },
    professional: { envSet: stripePriceProfessionalSet, exists: null, liveMode: null },
    modeMatchesPrices: null,
  }

  let stripeWebhookRegistration: {
    expectedUrl: string
    registered: boolean | null
    matchedEndpointIds: string[]
    error?: string
  } = {
    expectedUrl: expectedWebhookUrl,
    registered: null,
    matchedEndpointIds: [],
  }

  if (stripeKeysConfigured) {
    try {
      const stripe = getStripeServer()

      if (stripePriceStarterSet) {
        try {
          const price = await stripe.prices.retrieve(STRIPE_PRICE_STARTER)
          stripePriceChecks.starter.exists = Boolean(price?.id)
          stripePriceChecks.starter.liveMode = Boolean((price as any)?.livemode)
        } catch (e: any) {
          stripePriceChecks.starter.exists = false
          stripePriceChecks.starter.liveMode = null
          stripePriceChecks.starter.error = String(e?.message || e)
        }
      } else {
        stripePriceChecks.starter.exists = false
      }

      if (stripePriceProfessionalSet) {
        try {
          const price = await stripe.prices.retrieve(STRIPE_PRICE_PROFESSIONAL)
          stripePriceChecks.professional.exists = Boolean(price?.id)
          stripePriceChecks.professional.liveMode = Boolean((price as any)?.livemode)
        } catch (e: any) {
          stripePriceChecks.professional.exists = false
          stripePriceChecks.professional.liveMode = null
          stripePriceChecks.professional.error = String(e?.message || e)
        }
      } else {
        stripePriceChecks.professional.exists = false
      }

      const mode = stripeMode(STRIPE_SECRET_KEY)
      if (mode === 'test' || mode === 'live') {
        const starterOk =
          stripePriceChecks.starter.liveMode === null
            ? null
            : stripePriceChecks.starter.liveMode === (mode === 'live')
        const proOk =
          stripePriceChecks.professional.liveMode === null
            ? null
            : stripePriceChecks.professional.liveMode === (mode === 'live')
        if (starterOk === null || proOk === null) {
          stripePriceChecks.modeMatchesPrices = null
        } else {
          stripePriceChecks.modeMatchesPrices = Boolean(starterOk && proOk)
        }
      }

      try {
        const list = await stripe.webhookEndpoints.list({ limit: 100 })
        const expected = expectedWebhookUrl.toLowerCase()
        const matches =
          list?.data?.filter((w) => (w?.url || '').toLowerCase() === expected) || []
        stripeWebhookRegistration.registered = matches.length > 0
        stripeWebhookRegistration.matchedEndpointIds = matches.map((m) => m.id)
      } catch (e: any) {
        stripeWebhookRegistration.registered = null
        stripeWebhookRegistration.error = String(e?.message || e)
      }
    } catch (e: any) {
      // Stripe server not configured or key invalid.
      stripeWebhookRegistration.registered = null
      stripeWebhookRegistration.error = String(e?.message || e)
      stripePriceChecks.starter.exists = stripePriceStarterSet ? null : false
      stripePriceChecks.professional.exists = stripePriceProfessionalSet ? null : false
    }
  }

  let databaseHealthy = false
  let databaseLatencyMs: number | null = null
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    databaseLatencyMs = Date.now() - start
    databaseHealthy = true
  } catch {
    databaseHealthy = false
  }

  const adminCount = await prisma.platformAdmin.count().catch(() => 0)
  const atLeastOneAdminUserExists = adminCount > 0

  const terms = await canFetchPage(origin, '/terms')
  const privacy = await canFetchPage(origin, '/privacy')
  const termsPrivacyAccessible = terms.ok && privacy.ok

  const testEmailTo = process.env.LAUNCH_READINESS_TEST_EMAIL_TO || process.env.SUPPORT_TO || process.env.CONTACT_TO || ''
  const testEmailFrom = process.env.LAUNCH_READINESS_TEST_EMAIL_FROM || process.env.SUPPORT_FROM || process.env.CONTACT_FROM || process.env.RESEND_FROM_EMAIL || ''
  const emailTestConfigured = bool(testEmailTo) && bool(testEmailFrom)

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    stripe: {
      mode: stripeMode(STRIPE_SECRET_KEY),
      keysConfigured: stripeKeysConfigured,
      webhookSecretSet: stripeWebhookSecretSet,
      priceIds: {
        starter: { envSet: stripePriceStarterSet, exists: stripePriceChecks.starter.exists, liveMode: stripePriceChecks.starter.liveMode, error: stripePriceChecks.starter.error || null },
        professional: { envSet: stripePriceProfessionalSet, exists: stripePriceChecks.professional.exists, liveMode: stripePriceChecks.professional.liveMode, error: stripePriceChecks.professional.error || null },
        modeMatchesPrices: stripePriceChecks.modeMatchesPrices,
      },
      webhookEndpoint: {
        expectedUrl: stripeWebhookRegistration.expectedUrl,
        registered: stripeWebhookRegistration.registered,
        matchedEndpointIds: stripeWebhookRegistration.matchedEndpointIds,
        error: stripeWebhookRegistration.error || null,
      },
    },
    resend: { apiKeySet: resendApiKeySet },
    sentry: { dsnConfigured: sentryDsnConfigured },
    database: { healthy: databaseHealthy, latencyMs: databaseLatencyMs },
    admin: { count: adminCount, atLeastOneAdminUserExists },
    legal: {
      terms: { ok: terms.ok, status: (terms as any).status ?? 0 },
      privacy: { ok: privacy.ok, status: (privacy as any).status ?? 0 },
      termsPrivacyAccessible,
    },
    emailTest: {
      configured: emailTestConfigured,
      to: testEmailTo ? '(set)' : '(missing)',
      from: testEmailFrom ? '(set)' : '(missing)',
    },
  })
}

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin

  const testEmailTo =
    process.env.LAUNCH_READINESS_TEST_EMAIL_TO ||
    process.env.SUPPORT_TO ||
    process.env.CONTACT_TO

  const testEmailFrom =
    process.env.LAUNCH_READINESS_TEST_EMAIL_FROM ||
    process.env.SUPPORT_FROM ||
    process.env.CONTACT_FROM ||
    process.env.RESEND_FROM_EMAIL

  if (!testEmailTo) {
    return NextResponse.json(
      { ok: false, error: 'Missing test recipient. Set LAUNCH_READINESS_TEST_EMAIL_TO (or SUPPORT_TO/CONTACT_TO).' },
      { status: 400 }
    )
  }

  if (!testEmailFrom) {
    return NextResponse.json(
      { ok: false, error: 'Missing from address. Set LAUNCH_READINESS_TEST_EMAIL_FROM (or SUPPORT_FROM/CONTACT_FROM/RESEND_FROM_EMAIL).' },
      { status: 400 }
    )
  }

  const result = await sendEmail({
    to: testEmailTo,
    from: testEmailFrom,
    subject: 'Fixology Launch Readiness: test email',
    text: [
      'This is a test email generated by Fixology Admin → Launch Readiness.',
      '',
      `Origin: ${origin}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n'),
    tags: [{ name: 'type', value: 'launch_readiness_test' }],
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: result.id || null })
}


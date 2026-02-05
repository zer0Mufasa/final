import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    // Check for required columns that commonly drift in production if migrations didn't run.
    const requiredColumns: Array<{ table: string; column: string }> = [
      { table: 'shops', column: 'imei_credits' },
      { table: 'shops', column: 'onboarding_completed_at' },
      { table: 'shops', column: 'business_hours' },
    ]

    const missing: string[] = []
    for (const { table, column } of requiredColumns) {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
        table,
        column
      )) as any[]
      if (!rows?.length) missing.push(`${table}.${column}`)
    }

    if (missing.length) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: {
            status: 'connected',
            latency: dbLatency,
          },
          schema: {
            ok: false,
            missing,
          },
          integrations: {
            stripe: {
              configured:
                Boolean(process.env.STRIPE_SECRET_KEY) &&
                Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
                (Boolean(process.env.STRIPE_PRICE_STARTER) ||
                  Boolean(process.env.STRIPE_PRICE_PROFESSIONAL)),
              hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
              hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
              hasPriceIds:
                Boolean(process.env.STRIPE_PRICE_STARTER) ||
                Boolean(process.env.STRIPE_PRICE_PROFESSIONAL),
            },
            email: {
              configured: Boolean(process.env.RESEND_API_KEY),
              hasResendKey: Boolean(process.env.RESEND_API_KEY),
              hasFrom: Boolean(process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM),
              hasContactRouting: Boolean(process.env.CONTACT_TO) && Boolean(process.env.CONTACT_FROM),
            },
            monitoring: {
              configured: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
              hasSentryDsn: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
            },
            supabase: {
              configured:
                Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
                Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            },
            site: {
              hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL),
            },
          },
          blockers: [
            !process.env.STRIPE_SECRET_KEY ? 'Stripe secret key missing (STRIPE_SECRET_KEY)' : null,
            !process.env.STRIPE_WEBHOOK_SECRET ? 'Stripe webhook secret missing (STRIPE_WEBHOOK_SECRET)' : null,
            !(process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_PROFESSIONAL)
              ? 'Stripe price IDs missing (STRIPE_PRICE_STARTER/STRIPE_PRICE_PROFESSIONAL)'
              : null,
            !process.env.RESEND_API_KEY ? 'Transactional email not configured (RESEND_API_KEY)' : null,
            !(process.env.CONTACT_TO && process.env.CONTACT_FROM)
              ? 'Contact routing not configured (CONTACT_TO/CONTACT_FROM)'
              : null,
            null, // Terms/Privacy are page-level, not env-level.
            null, // Mobile layout is UI-level.
          ].filter(Boolean),
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      database: {
        status: 'connected',
        latency: dbLatency,
      },
      schema: {
        ok: true,
      },
      integrations: {
        stripe: {
          configured:
            Boolean(process.env.STRIPE_SECRET_KEY) &&
            Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
            (Boolean(process.env.STRIPE_PRICE_STARTER) ||
              Boolean(process.env.STRIPE_PRICE_PROFESSIONAL)),
          hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
          hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
          hasPriceIds:
            Boolean(process.env.STRIPE_PRICE_STARTER) ||
            Boolean(process.env.STRIPE_PRICE_PROFESSIONAL),
        },
        email: {
          configured: Boolean(process.env.RESEND_API_KEY),
          hasResendKey: Boolean(process.env.RESEND_API_KEY),
          hasFrom: Boolean(process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM),
          hasContactRouting: Boolean(process.env.CONTACT_TO) && Boolean(process.env.CONTACT_FROM),
        },
        monitoring: {
          configured: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
          hasSentryDsn: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
        },
        supabase: {
          configured:
            Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
            Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
        site: {
          hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL),
        },
      },
      blockers: [
        !process.env.STRIPE_SECRET_KEY ? 'Stripe secret key missing (STRIPE_SECRET_KEY)' : null,
        !process.env.STRIPE_WEBHOOK_SECRET ? 'Stripe webhook secret missing (STRIPE_WEBHOOK_SECRET)' : null,
        !(process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_PROFESSIONAL)
          ? 'Stripe price IDs missing (STRIPE_PRICE_STARTER/STRIPE_PRICE_PROFESSIONAL)'
          : null,
        !process.env.RESEND_API_KEY ? 'Transactional email not configured (RESEND_API_KEY)' : null,
        !(process.env.CONTACT_TO && process.env.CONTACT_FROM)
          ? 'Contact routing not configured (CONTACT_TO/CONTACT_FROM)'
          : null,
        null,
        null,
      ].filter(Boolean),
      api: {
        status: 'operational',
        uptime: 99.9,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: {
          status: 'error',
          error: error.message,
        },
        schema: {
          ok: false,
        },
        integrations: {
          stripe: {
            configured: false,
            hasSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
            hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
            hasPriceIds:
              Boolean(process.env.STRIPE_PRICE_STARTER) ||
              Boolean(process.env.STRIPE_PRICE_PROFESSIONAL),
          },
          email: {
            configured: Boolean(process.env.RESEND_API_KEY),
            hasResendKey: Boolean(process.env.RESEND_API_KEY),
            hasFrom: Boolean(process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM),
            hasContactRouting: Boolean(process.env.CONTACT_TO) && Boolean(process.env.CONTACT_FROM),
          },
          monitoring: {
            configured: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
            hasSentryDsn: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
          },
          supabase: {
            configured:
              Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
              Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          },
          site: {
            hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VERCEL_URL),
          },
        },
        blockers: [
          !process.env.STRIPE_SECRET_KEY ? 'Stripe secret key missing (STRIPE_SECRET_KEY)' : null,
          !process.env.STRIPE_WEBHOOK_SECRET ? 'Stripe webhook secret missing (STRIPE_WEBHOOK_SECRET)' : null,
          !(process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_PROFESSIONAL)
            ? 'Stripe price IDs missing (STRIPE_PRICE_STARTER/STRIPE_PRICE_PROFESSIONAL)'
            : null,
          !process.env.RESEND_API_KEY ? 'Transactional email not configured (RESEND_API_KEY)' : null,
          !(process.env.CONTACT_TO && process.env.CONTACT_FROM)
            ? 'Contact routing not configured (CONTACT_TO/CONTACT_FROM)'
            : null,
          null,
          null,
        ].filter(Boolean),
        api: {
          status: 'operational',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}


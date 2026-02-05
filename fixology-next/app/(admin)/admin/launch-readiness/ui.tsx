'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Mail, CreditCard, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Level = 'pass' | 'warn' | 'fail'

type ReadinessResponse = {
  timestamp: string
  stripe: {
    mode: 'test' | 'live' | 'unknown'
    keysConfigured: boolean
    webhookSecretSet: boolean
    priceIds: {
      starter: { envSet: boolean; exists: boolean | null; liveMode: boolean | null; error: string | null }
      professional: { envSet: boolean; exists: boolean | null; liveMode: boolean | null; error: string | null }
      modeMatchesPrices: boolean | null
    }
    webhookEndpoint: {
      expectedUrl: string
      registered: boolean | null
      matchedEndpointIds: string[]
      error: string | null
    }
  }
  resend: { apiKeySet: boolean }
  sentry: { dsnConfigured: boolean }
  database: { healthy: boolean; latencyMs: number | null }
  admin: { count: number; atLeastOneAdminUserExists: boolean }
  legal: {
    terms: { ok: boolean; status: number }
    privacy: { ok: boolean; status: number }
    termsPrivacyAccessible: boolean
  }
  emailTest: { configured: boolean; to: string; from: string }
}

function pill(level: Level) {
  if (level === 'pass') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
  if (level === 'warn') return 'bg-amber-500/15 text-amber-300 border-amber-500/25'
  return 'bg-rose-500/15 text-rose-300 border-rose-500/25'
}

function icon(level: Level) {
  if (level === 'pass') return <CheckCircle className="w-4 h-4 text-emerald-300" />
  if (level === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-300" />
  return <XCircle className="w-4 h-4 text-rose-300" />
}

export function AdminLaunchReadinessClient() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<ReadinessResponse | null>(null)
  const [emailTesting, setEmailTesting] = useState(false)
  const [lastEmailTest, setLastEmailTest] = useState<{ ok: boolean; id?: string; error?: string } | null>(null)

  async function load() {
    const res = await fetch('/api/admin/launch-readiness', { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `Failed to load (${res.status})`)
    setData(json as ReadinessResponse)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load()
      .catch((e) => {
        if (!cancelled) toast.error(String((e as any)?.message || e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refresh() {
    setRefreshing(true)
    try {
      await load()
      toast.success('Refreshed launch readiness')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  async function testEmail() {
    setEmailTesting(true)
    setLastEmailTest(null)
    try {
      const res = await fetch('/api/admin/launch-readiness', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json?.error || `Test failed (${res.status})`
        setLastEmailTest({ ok: false, error: msg })
        toast.error(msg)
        return
      }
      setLastEmailTest({ ok: true, id: json?.id || undefined })
      toast.success('Test email sent')
    } catch (e: any) {
      const msg = e?.message || 'Test failed'
      setLastEmailTest({ ok: false, error: msg })
      toast.error(msg)
    } finally {
      setEmailTesting(false)
    }
  }

  const checks = useMemo(() => {
    if (!data) return []

    const rows: Array<{
      id: string
      label: string
      level: Level
      detail: string
      hint?: string
    }> = []

    const stripeMode = data.stripe.mode
    rows.push({
      id: 'stripe-mode',
      label: 'Stripe mode indicator',
      level: stripeMode === 'live' ? 'warn' : stripeMode === 'test' ? 'pass' : 'warn',
      detail: stripeMode === 'live' ? 'Live mode' : stripeMode === 'test' ? 'Test mode' : 'Unknown',
      hint: stripeMode === 'live' ? 'Double-check keys/webhooks before launch.' : undefined,
    })

    rows.push({
      id: 'stripe-secret',
      label: 'Stripe keys configured',
      level: data.stripe.keysConfigured ? 'pass' : 'fail',
      detail: data.stripe.keysConfigured ? 'STRIPE_SECRET_KEY present' : 'Missing STRIPE_SECRET_KEY',
    })

    rows.push({
      id: 'stripe-webhook',
      label: 'Stripe webhook secret set',
      level: data.stripe.webhookSecretSet ? 'pass' : 'fail',
      detail: data.stripe.webhookSecretSet ? 'STRIPE_WEBHOOK_SECRET present' : 'Missing STRIPE_WEBHOOK_SECRET',
    })

    rows.push({
      id: 'stripe-prices-env',
      label: 'Stripe Price IDs configured',
      level:
        data.stripe.priceIds.starter.envSet && data.stripe.priceIds.professional.envSet
          ? 'pass'
          : 'fail',
      detail:
        data.stripe.priceIds.starter.envSet && data.stripe.priceIds.professional.envSet
          ? 'STRIPE_PRICE_STARTER + STRIPE_PRICE_PROFESSIONAL present'
          : `Missing ${[
              data.stripe.priceIds.starter.envSet ? null : 'STRIPE_PRICE_STARTER',
              data.stripe.priceIds.professional.envSet ? null : 'STRIPE_PRICE_PROFESSIONAL',
            ]
              .filter(Boolean)
              .join(', ')}`,
    })

    const starterExists = data.stripe.priceIds.starter.exists
    const proExists = data.stripe.priceIds.professional.exists
    const existsLevel: Level =
      starterExists === false || proExists === false
        ? 'fail'
        : starterExists === null || proExists === null
          ? 'warn'
          : 'pass'

    rows.push({
      id: 'stripe-prices-exist',
      label: 'Stripe Price IDs valid (exist in Stripe)',
      level: existsLevel,
      detail:
        existsLevel === 'pass'
          ? 'Both Price IDs found'
          : existsLevel === 'warn'
            ? 'Unable to verify (Stripe API unavailable)'
            : `Invalid price id(s): ${
                [
                  starterExists === false ? 'starter' : null,
                  proExists === false ? 'professional' : null,
                ]
                  .filter(Boolean)
                  .join(', ') || 'unknown'
              }`,
      hint:
        data.stripe.priceIds.starter.error || data.stripe.priceIds.professional.error
          ? `Stripe error: ${data.stripe.priceIds.starter.error || data.stripe.priceIds.professional.error}`
          : undefined,
    })

    rows.push({
      id: 'stripe-mode-prices',
      label: 'Stripe test/live mode matches Price IDs',
      level:
        data.stripe.priceIds.modeMatchesPrices === true
          ? 'pass'
          : data.stripe.priceIds.modeMatchesPrices === false
            ? 'fail'
            : 'warn',
      detail:
        data.stripe.priceIds.modeMatchesPrices === true
          ? 'Mode matches (keys ↔ prices)'
          : data.stripe.priceIds.modeMatchesPrices === false
            ? 'Mismatch: test key with live prices (or vice versa)'
            : 'Not enough info to confirm',
    })

    const webhookReg = data.stripe.webhookEndpoint
    rows.push({
      id: 'stripe-webhook-registered',
      label: 'Webhook endpoint registered in Stripe',
      level:
        webhookReg.registered === true
          ? 'pass'
          : webhookReg.registered === false
            ? 'fail'
            : 'warn',
      detail:
        webhookReg.registered === true
          ? `Registered (${webhookReg.matchedEndpointIds.length} endpoint)`
          : webhookReg.registered === false
            ? 'Not registered'
            : 'Unable to verify (Stripe API unavailable)',
      hint:
        webhookReg.registered === true
          ? `Expected URL: ${webhookReg.expectedUrl}`
          : webhookReg.error
            ? `Expected URL: ${webhookReg.expectedUrl}. Stripe error: ${webhookReg.error}`
            : `Add this URL in Stripe: ${webhookReg.expectedUrl}`,
    })

    rows.push({
      id: 'resend-key',
      label: 'Resend API key set',
      level: data.resend.apiKeySet ? 'pass' : 'fail',
      detail: data.resend.apiKeySet ? 'RESEND_API_KEY present' : 'Missing RESEND_API_KEY',
    })

    rows.push({
      id: 'sentry',
      label: 'Sentry DSN configured',
      level: data.sentry.dsnConfigured ? 'pass' : 'warn',
      detail: data.sentry.dsnConfigured ? 'SENTRY_DSN present' : 'Missing SENTRY_DSN (recommended)',
    })

    rows.push({
      id: 'db',
      label: 'Database connection healthy',
      level: data.database.healthy ? 'pass' : 'fail',
      detail: data.database.healthy
        ? `Connected (${data.database.latencyMs ?? '—'}ms)`
        : 'Cannot connect',
    })

    rows.push({
      id: 'admin',
      label: 'At least one admin user exists',
      level: data.admin.atLeastOneAdminUserExists ? 'pass' : 'fail',
      detail: data.admin.atLeastOneAdminUserExists
        ? `${data.admin.count} admin(s) found`
        : 'No PlatformAdmin users found',
    })

    rows.push({
      id: 'legal',
      label: 'Terms/Privacy pages accessible',
      level: data.legal.termsPrivacyAccessible ? 'pass' : 'fail',
      detail: data.legal.termsPrivacyAccessible
        ? 'Both pages return 200'
        : `Terms: ${data.legal.terms.status} • Privacy: ${data.legal.privacy.status}`,
    })

    const emailTestLevel: Level =
      lastEmailTest?.ok === true
        ? 'pass'
        : lastEmailTest?.ok === false
          ? 'fail'
          : data.emailTest.configured
            ? 'warn'
            : 'fail'

    rows.push({
      id: 'email-test',
      label: 'Email sending works (test send)',
      level: emailTestLevel,
      detail:
        lastEmailTest?.ok === true
          ? `Sent (id: ${lastEmailTest.id || '—'})`
          : lastEmailTest?.ok === false
            ? `Failed: ${lastEmailTest.error || 'unknown'}`
            : data.emailTest.configured
              ? 'Ready to test'
              : 'Missing test email routing env',
      hint: data.emailTest.configured
        ? 'Click “Send test email”.'
        : 'Set LAUNCH_READINESS_TEST_EMAIL_TO and LAUNCH_READINESS_TEST_EMAIL_FROM (or CONTACT_TO/CONTACT_FROM).',
    })

    return rows
  }, [data, lastEmailTest])

  const score = useMemo(() => {
    const total = checks.length || 1
    const passed = checks.filter((c) => c.level === 'pass').length
    const failed = checks.filter((c) => c.level === 'fail').length
    return { total, passed, failed }
  }, [checks])

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Launch Readiness"
        kicker="Fixology Admin"
        description="One-page checklist for a safe public launch."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
            <button
              onClick={testEmail}
              disabled={emailTesting || loading}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className={cn('w-4 h-4', emailTesting && 'animate-pulse')} />
              {emailTesting ? 'Sending…' : 'Send test email'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-white/50">Passed</div>
              <div className="text-2xl font-extrabold text-white/90">{score.passed}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <div className="text-xs text-white/50">Failed</div>
              <div className="text-2xl font-extrabold text-white/90">{score.failed}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <div className="text-xs text-white/50">Checked</div>
              <div className="text-2xl font-extrabold text-white/90">
                {score.total}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">Checklist</div>
          <div className="text-xs text-white/50">
            Updated {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '—'}
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {loading && (
            <div className="px-6 py-6 text-sm text-white/60">Loading checks…</div>
          )}

          {!loading &&
            checks.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start gap-4">
                <div className="mt-0.5">{icon(c.level)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-white/90">{c.label}</div>
                    <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-semibold', pill(c.level))}>
                      {c.level === 'pass' ? 'GREEN' : c.level === 'warn' ? 'YELLOW' : 'RED'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-white/60">{c.detail}</div>
                  {c.hint ? <div className="mt-1 text-xs text-white/40">{c.hint}</div> : null}
                </div>
              </div>
            ))}
        </div>
      </GlassCard>
    </div>
  )
}


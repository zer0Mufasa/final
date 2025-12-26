'use client'

import { useEffect } from 'react'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '10%', left: '10%' }} />
      <div className="glow-spot" style={{ bottom: '12%', right: '12%', opacity: 0.75 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div className="glass-card" style={{ maxWidth: 860, margin: '0 auto', padding: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(196,181,253,.9)' }}>Fixology Setup</div>
          <h1 className="section-title" style={{ fontSize: 28, marginTop: 10, marginBottom: 10 }}>
            We couldn’t load onboarding
          </h1>
          <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 14 }}>
            This is usually a database connectivity issue (P1001) or a migration that hasn’t run yet.
          </p>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid rgba(167,139,250,.18)',
              background: 'rgba(15,10,26,.45)',
              color: 'rgba(196,181,253,.75)',
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            <div style={{ color: 'rgba(196,181,253,.9)', fontWeight: 900, marginBottom: 6 }}>Debug info</div>
            <div>Digest: {error.digest || 'n/a'}</div>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{String(error.message || '')}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="glow-button" onClick={() => reset()} style={{ padding: '12px 16px' }}>
              Try again
            </button>
            <a className="glow-button glow-button-secondary" href="/login" style={{ padding: '12px 16px' }}>
              Back to login
            </a>
          </div>

          <p style={{ color: 'rgba(196,181,253,.55)', fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>
            Vercel fix: set <strong>DATABASE_URL</strong> to Supabase <strong>Transaction Pooler</strong> (port 6543) and
            redeploy.
          </p>
        </div>
      </div>
    </div>
  )
}



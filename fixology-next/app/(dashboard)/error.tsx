'use client'

import { useEffect } from 'react'

export default function DashboardError({
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
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] flex items-center justify-center px-6">
      <div className="glass-card" style={{ maxWidth: 720, width: '100%', padding: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(196,181,253,.9)' }}>Fixology</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 10 }}>
          We couldn’t load your dashboard
        </h1>
        <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 14 }}>
          This is usually caused by one of two things:
        </p>
        <ul style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.75, paddingLeft: 18, marginBottom: 16 }}>
          <li>
            <strong style={{ color: '#fff' }}>Database unreachable</strong> (Supabase connection string / pooling / networking)
          </li>
          <li>
            <strong style={{ color: '#fff' }}>Migrations not applied yet</strong> after a schema update
          </li>
        </ul>
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
          If this is on Vercel: use the Supabase <strong>pooler</strong> DATABASE_URL (port 6543) and redeploy. Then run
          migrations (or let the next build apply them).
        </p>
      </div>
    </div>
  )
}



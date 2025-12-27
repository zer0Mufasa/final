'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0f0a1a] flex items-center justify-center px-6">
          <div
            style={{
              maxWidth: 720,
              width: '100%',
              padding: 28,
              background: 'linear-gradient(135deg, rgba(255,255,255,.04) 0%, rgba(15,10,26,.92) 100%)',
              backdropFilter: 'blur(22px)',
              border: '1px solid rgba(255,255,255,.10)',
              borderRadius: 32,
              boxShadow: '0 24px 90px rgba(0,0,0,0.52)',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(196,181,253,.9)' }}>Fixology</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 14 }}>
              An unexpected error occurred. Please try again.
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
              <div style={{ color: 'rgba(196,181,253,.9)', fontWeight: 900, marginBottom: 6 }}>Error details</div>
              <div>Digest: {error.digest || 'n/a'}</div>
              <div style={{ marginTop: 8, opacity: 0.9 }}>{String(error.message || 'Unknown error')}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #a78bfa 100%)',
                  backgroundSize: '200% 200%',
                  border: 'none',
                  borderRadius: 18,
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#0f0a1a',
                  cursor: 'pointer',
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  boxShadow: '0 14px 46px rgba(167,139,250,.26)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 18px 64px rgba(167,139,250,.36)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 14px 46px rgba(167,139,250,.26)'
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,.14)',
                  borderRadius: 18,
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'rgba(196,181,253,.92)',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all .2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(167,139,250,.10)'
                  e.currentTarget.style.borderColor = 'rgba(167,139,250,.55)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)'
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}


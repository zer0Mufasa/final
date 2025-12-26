'use client'

// app/(auth)/forgot-password/page.tsx
// Password reset request page (styled to match marketing homepage theme)

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Invalid email address')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      // Always show success to prevent email enumeration
      setSent(true)
    } catch (error) {
      console.error('Reset error:', error)
      // Always show success to prevent email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen">
        <div className="glow-spot" style={{ top: '10%', left: '12%' }} />
        <div className="glow-spot" style={{ bottom: '12%', right: '12%', opacity: 0.75 }} />

        <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Right (mobile first): card */}
            <div className="order-1 lg:order-2 fade-in">
              <div className="glass-card" style={{ padding: 32, maxWidth: 560, marginLeft: 'auto', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  <Link href="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <ArrowLeft style={{ width: 18, height: 18 }} aria-hidden="true" />
                    Back to login
                  </Link>
                  <span className="auth-kicker">Password reset</span>
                </div>

                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: 'rgba(74,222,128,.12)',
                    border: '1px solid rgba(74,222,128,.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '8px auto 16px',
                  }}
                >
                  <CheckCircle style={{ width: 30, height: 30, color: '#4ade80' }} aria-hidden="true" />
                </div>

                <h1 className="section-title" style={{ fontSize: 30, marginBottom: 10 }}>
                  Check your email
                </h1>
                <p className="auth-muted" style={{ lineHeight: 1.6, marginBottom: 10 }}>
                  If your email exists in Fixology, you&apos;ll get a secure reset link.
                </p>
                <p style={{ fontSize: 12, color: 'rgba(196,181,253,.55)', lineHeight: 1.6, marginBottom: 18 }}>
                  Check spam too — links expire in about 15 minutes.
                </p>

                <Link
                  href="/login"
                  className="glow-button"
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    textDecoration: 'none',
                  }}
                >
                  Back to log in
                </Link>
              </div>
            </div>

            {/* Left (desktop): reassurance */}
            <div className="order-2 lg:order-1 fade-in">
              <div style={{ maxWidth: 720 }}>
                <span className="auth-kicker">✨ Built for repair shops</span>
                <h2 className="section-title" style={{ fontSize: 44, marginTop: 18, marginBottom: 14 }}>
                  Get back in fast.
                  <br />
                  <span style={{ color: '#a78bfa' }}>No support ticket needed.</span>
                </h2>
                <p className="auth-muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 22 }}>
                  We use a secure email reset link so you can recover access without exposing passwords or sensitive info.
                </p>

                <div className="glass-card" style={{ padding: 22, borderRadius: 20 }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[
                      { k: '🔒 Secure by design', v: 'We don’t reveal whether an email exists.' },
                      { k: '⏱️ Quick reset', v: 'Most shops are back in under a minute.' },
                      { k: '🛡️ Safe links', v: 'Links expire quickly to reduce risk.' },
                    ].map((r) => (
                      <div key={r.k} style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(15,10,26,.55)' }}>
                        <div style={{ fontSize: 12, color: 'rgba(196,181,253,.75)', marginBottom: 6 }}>{r.k}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '10%', left: '12%' }} />
      <div className="glow-spot" style={{ bottom: '12%', right: '12%', opacity: 0.75 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Right (mobile first): form */}
          <div className="order-1 lg:order-2 fade-in">
            <div className="glass-card" style={{ padding: 32, maxWidth: 560, marginLeft: 'auto' }}>
              <Link href="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 18 }}>
                <ArrowLeft style={{ width: 18, height: 18 }} aria-hidden="true" />
                Back to login
              </Link>

              {error && (
                <div
                  role="alert"
                  style={{
                    marginBottom: 14,
                    padding: 12,
                    borderRadius: 14,
                    background: 'rgba(239,68,68,.10)',
                    border: '1px solid rgba(239,68,68,.30)',
                    color: '#ef4444',
                    fontSize: 12,
                  }}
                >
                  {error}
                </div>
              )}

              <h1 className="section-title" style={{ fontSize: 34, marginBottom: 8 }}>
                Reset your password
              </h1>
              <p className="auth-muted" style={{ marginBottom: 18, lineHeight: 1.6 }}>
                Enter the email associated with your Fixology account.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="email" className="auth-label">
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 18,
                        height: 18,
                        color: 'rgba(196,181,253,.65)',
                      }}
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="auth-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isValidEmail(email)}
                  className="glow-button"
                  style={{ width: '100%', marginTop: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>

                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    borderRadius: 14,
                    background: 'rgba(167,139,250,.08)',
                    border: '1px solid rgba(167,139,250,.18)',
                    fontSize: 12,
                    color: 'rgba(196,181,253,.75)',
                    lineHeight: 1.6,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <span aria-hidden="true">🔒</span>
                  <span>
                    We&apos;ll email you a secure reset link. We don&apos;t reveal whether an email exists. Reset links expire quickly.
                  </span>
                </div>
              </form>

              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'rgba(196,181,253,.70)' }}>
                Remembered it?{' '}
                <Link href="/login" className="auth-link" style={{ fontWeight: 700 }}>
                  Log in
                </Link>{' '}
                ·{' '}
                <Link href="/contact" className="auth-link" style={{ fontWeight: 700 }}>
                  Need help?
                </Link>
              </div>
            </div>
          </div>

          {/* Left (desktop): reassurance */}
          <div className="order-2 lg:order-1 fade-in">
            <div style={{ maxWidth: 720 }}>
              <span className="auth-kicker">✨ Built for repair shops</span>
              <h2 className="section-title" style={{ fontSize: 44, marginTop: 18, marginBottom: 14 }}>
                Secure recovery.
                <br />
                <span style={{ color: '#a78bfa' }}>No friction.</span>
              </h2>
              <p className="auth-muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 22 }}>
                Fixology is designed to stay out of your way — even when you need access back quickly.
              </p>

              <div className="glass-card" style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { k: '✅ Fast', v: 'One email, one click, done.' },
                    { k: '🛡️ Safe', v: 'Short-lived links reduce risk.' },
                    { k: '🔒 Private', v: 'We avoid email enumeration.' },
                  ].map((r) => (
                    <div key={r.k} style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(15,10,26,.55)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(196,181,253,.75)', marginBottom: 6 }}>{r.k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

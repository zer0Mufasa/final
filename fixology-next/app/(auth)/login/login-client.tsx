'use client'

// app/(auth)/login/login-client.tsx
// Login UI (client component). Wrapped in Suspense by page.tsx.

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { ReticleIcon } from '@/components/shared/reticle-icon'
import { toast } from '@/components/ui/toaster'

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [rememberMe, setRememberMe] = useState(false)

  const validate = (vals?: { email?: string; password?: string }) => {
    const newErrors: { email?: string; password?: string } = {}
    const emailToCheck = (vals?.email ?? email).trim()
    const passwordToCheck = vals?.password ?? password

    if (!emailToCheck) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      newErrors.email = 'Invalid email address'
    }

    if (!passwordToCheck) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // IMPORTANT: capture browser autofill values even if React state didn't update
    const form = e.currentTarget as HTMLFormElement
    const fd = new FormData(form)
    const emailFromForm = String(fd.get('email') || email).trim()
    const passwordFromForm = String(fd.get('password') || password)

    if (emailFromForm !== email) setEmail(emailFromForm)
    if (passwordFromForm !== password) setPassword(passwordFromForm)

    if (!validate({ email: emailFromForm, password: passwordFromForm })) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFromForm, password: passwordFromForm }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.error || 'Failed to sign in'
        toast.error(msg.includes('Invalid login credentials') ? 'Invalid email or password' : msg)
        setLoading(false)
        return
      }

      toast.success('Welcome back!')
      // Use window.location for full page navigation to avoid refresh loop
      window.location.href = redirect
    } catch (error: any) {
      console.error('Login exception:', error)
      toast.error(error?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const enterDemo = () => {
    // UI-only access for building out dashboard flows without backend dependencies.
    // Clears any prior real-session cookies by moving the app into demo mode explicitly.
    document.cookie = `fx_demo=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    toast.success('Entered demo mode')
    // Use window.location for full page navigation to avoid refresh loop
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '10%', left: '10%' }} />
      <div className="glow-spot" style={{ bottom: '10%', right: '10%', opacity: 0.75 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20 auth-grid">
          {/* Right (mobile first): auth card */}
          <div className="order-1 lg:order-2 fade-in">
            <div className="glass-card auth-card" style={{ padding: 32, maxWidth: 560, marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                <Link href="/" className="auth-link" aria-label="Back to Fixology home">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg,#a78bfa 0%,#c4b5fd 100%)',
                        color: '#0f0a1a',
                        fontWeight: 800,
                      }}
                      aria-hidden="true"
                    >
                      ⚡
                    </span>
                    <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Fixology</span>
                  </span>
                </Link>
                <span className="auth-kicker">Secure sign-in</span>
              </div>

              <h1 className="section-title" style={{ fontSize: 34, marginBottom: 8 }}>
                Welcome back
              </h1>
              <p className="auth-muted" style={{ marginBottom: 22, lineHeight: 1.6 }}>
                Log in to your Fixology dashboard.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="email" className="auth-label">
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      className="pointer-events-none"
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
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors({ ...errors, email: undefined })
                      }}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="auth-input"
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email && <p className="auth-error">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="auth-label">
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      className="pointer-events-none"
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
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors({ ...errors, password: undefined })
                      }}
                      placeholder="Your password"
                      required
                      autoComplete="current-password"
                      className="auth-input"
                      aria-invalid={!!errors.password}
                    />
                  </div>
                  {errors.password && <p className="auth-error">{errors.password}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#a78bfa]"
                      style={{ width: 16, height: 16 }}
                    />
                    <span className="auth-muted" style={{ fontSize: 13 }}>
                      Remember me
                    </span>
                  </label>
                  <Link href="/forgot-password" className="auth-link" style={{ fontSize: 13 }}>
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glow-button"
                  style={{ width: '100%', marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  aria-label={loading ? 'Signing in' : 'Sign in'}
                >
                  {loading ? (
                    'Signing in…'
                  ) : (
                    <>
                      Sign in <ArrowRight style={{ width: 18, height: 18 }} aria-hidden="true" />
                    </>
                  )}
                </button>

                <button type="button" onClick={enterDemo} className="glow-button glow-button-secondary" style={{ width: '100%' }}>
                  Continue in demo mode
                </button>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: 'rgba(196,181,253,.55)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span aria-hidden="true">🔒</span>
                  <span>We never share your data</span>
                </div>
              </form>

              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'rgba(196,181,253,.70)' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="auth-link" style={{ fontWeight: 700 }}>
                  Sign up
                </Link>
              </div>
            </div>
          </div>

          {/* Left (desktop): subtle background + watermark (no marketing copy) */}
          <div className="order-2 lg:order-1 fade-in auth-side">
            <div style={{ position: 'relative', minHeight: 520 }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '12%',
                    width: 520,
                    height: 520,
                    borderRadius: 9999,
                    background: 'radial-gradient(circle, rgba(167,139,250,.12) 0%, transparent 70%)',
                    filter: 'blur(70px)',
                    opacity: 0.9,
                  }}
                />
                <div style={{ position: 'absolute', top: '18%', left: '8%', opacity: 0.14 }}>
                  <ReticleIcon size="xl" color="purple" variant="idle" className="w-[280px] h-[280px]" />
                </div>
              </div>

              {/* Copy layer (kept subtle; auth is task-first) */}
              <div className="hidden lg:block" style={{ position: 'relative', zIndex: 2, paddingTop: 34, maxWidth: 520 }}>
                <div className="auth-kicker" style={{ display: 'inline-flex', marginBottom: 14 }}>
                  Secure access
                </div>
                <h2 className="section-title" style={{ fontSize: 28, marginBottom: 10 }}>
                  Sign in and get back to the workbench.
                </h2>
                <p className="auth-muted" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
                  Fixology is built for repair professionals — fast intake, clear next steps, and calm AI signals when something looks risky.
                </p>

                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    'Tickets from one sentence (no busywork)',
                    'IMEI + risk signals before you touch it',
                    'Clean customer updates that write themselves',
                  ].map((t) => (
                    <div
                      key={t}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        color: 'rgba(196,181,253,.82)',
                      }}
                    >
                      <span style={{ color: '#4ade80', fontWeight: 900, lineHeight: 1.2 }} aria-hidden="true">
                        ✓
                      </span>
                      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18, opacity: 0.7 }}>
                  <span className="auth-muted" style={{ fontSize: 12 }}>
                    Secure access for repair professionals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


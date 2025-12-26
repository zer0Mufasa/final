'use client'

// app/(auth)/login/page.tsx
// Login page (styled to match marketing homepage theme)

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [rememberMe, setRememberMe] = useState(false)

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password')
        } else {
          toast.error(error.message)
        }
        return
      }
      
      toast.success('Welcome back!')
      router.push(redirect)
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '10%', left: '10%' }} />
      <div className="glow-spot" style={{ bottom: '10%', right: '10%', opacity: 0.75 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Right (mobile first): auth card */}
          <div className="order-1 lg:order-2 fade-in">
            <div className="glass-card" style={{ padding: 32, maxWidth: 560, marginLeft: 'auto' }}>
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
                  disabled={loading || !email || !password}
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

                <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(196,181,253,.55)', display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
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

          {/* Left (desktop): value prop / social proof */}
          <div className="order-2 lg:order-1 fade-in">
            <div style={{ maxWidth: 720 }}>
              <span className="auth-kicker">✨ Built for repair shops</span>
              <h2 className="section-title" style={{ fontSize: 44, marginTop: 18, marginBottom: 14 }}>
                Your techs stop guessing.
                <br />
                <span style={{ color: '#a78bfa' }}>Your tickets write themselves.</span>
              </h2>
              <p className="auth-muted" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 22 }}>
                Fixology turns messy customer messages into diagnoses, tickets, pricing, inventory actions, and customer updates — automatically.
              </p>

              <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
                {[
                  'Works with how your shop already runs',
                  'Fewer comebacks with guided steps + risk alerts',
                  'Tickets created from one sentence',
                ].map((t) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(196,181,253,.82)' }}>
                    <span style={{ color: '#4ade80', fontWeight: 900 }} aria-hidden="true">
                      ✓
                    </span>
                    <span style={{ fontSize: 15 }}>{t}</span>
                  </div>
                ))}
              </div>

              <div className="glass-card" style={{ padding: 22, borderRadius: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(167,139,250,.75)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Low-key social proof
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                  {[
                    { k: '⚡ Avg setup time', v: 'Under 2 minutes' },
                    { k: '📉 Fewer repeats', v: 'Guided steps + risk alerts' },
                    { k: '✅ Built for', v: 'Phone, console, PC shops' },
                  ].map((s) => (
                    <div key={s.k} style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(167,139,250,.12)', background: 'rgba(15,10,26,.55)' }}>
                      <div style={{ fontSize: 12, color: 'rgba(196,181,253,.75)', marginBottom: 6 }}>{s.k}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{s.v}</div>
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


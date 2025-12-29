'use client'

// app/(auth)/signup/page.tsx
// Signup page for new shops (styled to match marketing homepage theme)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'
import { Mail, Lock, User, Building, Phone, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReticleIcon } from '@/components/shared/reticle-icon'

export default function SignupPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required'
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Your name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep2()) return
    
    setLoading(true)
    
    try {
      // Sign up with Supabase Auth
      const supabase = createClient()
      
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.ownerName,
            shop_name: formData.shopName,
          },
        },
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('This email is already registered. Please login.')
        } else {
          toast.error(authError.message)
        }
        return
      }
      
      // Create shop via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: formData.shopName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        toast.error(result.error || 'Failed to create shop')
        return
      }
      
      toast.success('Account created! Welcome to Fixology!')
      router.push('/onboarding')
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '8%', right: '14%' }} />
      <div className="glow-spot" style={{ bottom: '12%', left: '10%', opacity: 0.7 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Right (mobile first): form */}
          <div className="order-1 lg:order-2 fade-in">
            <div className="glass-card" style={{ padding: 32, maxWidth: 620, marginLeft: 'auto' }}>
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
                <span className="auth-kicker">{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}</span>
              </div>

              <h1 className="section-title" style={{ fontSize: 34, marginBottom: 8 }}>
                Start building smarter repairs
              </h1>
              <p className="auth-muted" style={{ marginBottom: 18, lineHeight: 1.6 }}>
                {step === 1 ? 'Tell us about your shop.' : 'Set up your account details.'}
              </p>

              {/* Progress bar */}
              <div style={{ height: 8, background: 'rgba(167,139,250,.15)', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
                <div
                  style={{
                    height: '100%',
                    width: step === 1 ? '50%' : '100%',
                    background: 'linear-gradient(90deg, rgba(167,139,250,.95), rgba(196,181,253,.95))',
                    transition: 'width .25s ease',
                  }}
                />
              </div>

              <form
                onSubmit={
                  step === 2
                    ? handleSubmit
                    : (e) => {
                        e.preventDefault()
                        handleNextStep()
                      }
                }
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {step === 1 ? (
                  <>
                    <div>
                      <label htmlFor="shopName" className="auth-label">
                        Shop name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Building
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
                          id="shopName"
                          value={formData.shopName}
                          onChange={(e) => updateField('shopName', e.target.value)}
                          placeholder="Your repair shop"
                          className="auth-input"
                          autoComplete="organization"
                          aria-invalid={!!errors.shopName}
                        />
                      </div>
                      {errors.shopName && <p className="auth-error">{errors.shopName}</p>}
                    </div>

                    <div>
                      <label htmlFor="ownerName" className="auth-label">
                        Your name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
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
                          id="ownerName"
                          value={formData.ownerName}
                          onChange={(e) => updateField('ownerName', e.target.value)}
                          placeholder="Owner / manager"
                          className="auth-input"
                          autoComplete="name"
                          aria-invalid={!!errors.ownerName}
                        />
                      </div>
                      {errors.ownerName && <p className="auth-error">{errors.ownerName}</p>}
                    </div>

                    <button
                      type="submit"
                      className="glow-button"
                      disabled={loading || !formData.shopName.trim() || !formData.ownerName.trim()}
                      style={{ width: '100%', marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                      {formData.shopName.trim() || formData.ownerName.trim() ? (
                        <>
                          Continue <ArrowRight style={{ width: 18, height: 18 }} aria-hidden="true" />
                        </>
                      ) : (
                        'Continue'
                      )}
                    </button>

                    <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: 'rgba(196,181,253,.55)' }}>
                      Nice — this takes less than a minute.
                    </div>
                  </>
                ) : (
                  <>
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
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="you@example.com"
                          className="auth-input"
                          autoComplete="email"
                          aria-invalid={!!errors.email}
                        />
                      </div>
                      {errors.email && <p className="auth-error">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="auth-label">
                        Phone
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone
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
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className="auth-input"
                          autoComplete="tel"
                          aria-invalid={!!errors.phone}
                        />
                      </div>
                      {errors.phone && <p className="auth-error">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="password" className="auth-label">
                        Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock
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
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          placeholder="••••••••"
                          className="auth-input"
                          autoComplete="new-password"
                          aria-invalid={!!errors.password}
                        />
                      </div>
                      {errors.password && <p className="auth-error">{errors.password}</p>}
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(196,181,253,.55)' }}>
                        <span aria-hidden="true">🔒</span>
                        <span>We never share your data</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="auth-label">
                        Confirm password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock
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
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                          className="auth-input"
                          autoComplete="new-password"
                          aria-invalid={!!errors.confirmPassword}
                        />
                      </div>
                      {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, marginTop: 6 }}>
                      <button
                        type="button"
                        className="glow-button glow-button-secondary"
                        onClick={() => setStep(1)}
                        disabled={loading}
                        style={{ width: '100%' }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="glow-button"
                        disabled={loading || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword}
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                      >
                        {loading ? (
                          'Creating…'
                        ) : (
                          <>
                            Create account <ArrowRight style={{ width: 18, height: 18 }} aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'rgba(196,181,253,.55)' }}>
                      You&apos;re almost set up.
                    </div>
                  </>
                )}
              </form>

              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'rgba(196,181,253,.70)' }}>
                Already have an account?{' '}
                <Link href="/login" className="auth-link" style={{ fontWeight: 700 }}>
                  Log in
                </Link>
              </div>

              <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'rgba(196,181,253,.55)' }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" className="auth-link">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="auth-link">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>
          </div>

          {/* Left (desktop): subtle background + watermark (no marketing copy) */}
          <div className="order-2 lg:order-1 fade-in">
            <div style={{ position: 'relative', minHeight: 560 }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '12%',
                    left: '10%',
                    width: 560,
                    height: 560,
                    borderRadius: 9999,
                    background: 'radial-gradient(circle, rgba(167,139,250,.10) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    opacity: 0.9,
                  }}
                />
                <div style={{ position: 'absolute', top: '16%', left: '8%', opacity: 0.14 }}>
                  <ReticleIcon size="xl" color="purple" variant="idle" className="w-[300px] h-[300px]" />
                </div>
              </div>

              {/* Copy layer (kept subtle; auth is task-first) */}
              <div className="hidden lg:block" style={{ position: 'relative', zIndex: 2, paddingTop: 34, maxWidth: 540 }}>
                <div className="auth-kicker" style={{ display: 'inline-flex', marginBottom: 14 }}>
                  14-day free trial
                </div>
                <h2 className="section-title" style={{ fontSize: 28, marginBottom: 10 }}>
                  Set up your shop in minutes.
                </h2>
                <p className="auth-muted" style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>
                  Start with a calm workflow: intake → diagnosis → pricing → customer updates, with AI signals only when they matter.
                </p>

                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    'AI draft intake → creates clean tickets',
                    'Risk / warning indicators when needed',
                    'Upgrade anytime (Enterprise = contact sales)',
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


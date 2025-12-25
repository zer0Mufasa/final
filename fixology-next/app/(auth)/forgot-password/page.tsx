'use client'

// app/(auth)/forgot-password/page.tsx
// Password reset request page with premium two-column layout

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
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex flex-col justify-center px-12 py-16 bg-[#0a0a0f] relative">
          <Link href="/" className="flex items-center gap-3 mb-12 text-white no-underline group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
              🔧
            </div>
            <span className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight">Fixology</span>
          </Link>
          
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] text-white mb-4 leading-tight tracking-tight">
            Built for repair shops.
          </h1>
          <p className="text-lg text-white/70 mb-12 leading-relaxed">
            AI that runs your repair business. Stop guessing. Start diagnosing.
          </p>
          
          <ul className="space-y-6 mb-16">
            <li className="flex items-center gap-4 text-white">
              <span className="text-2xl">⚡</span>
              <span>Faster diagnostics.</span>
            </li>
            <li className="flex items-center gap-4 text-white">
              <span className="text-2xl">📈</span>
              <span>Smarter inventory.</span>
            </li>
            <li className="flex items-center gap-4 text-white">
              <span className="text-2xl">🛡️</span>
              <span>Fewer repeat repairs.</span>
            </li>
          </ul>

          {/* Social Proof */}
          <div className="mt-auto bg-[#12121a] border border-white/8 rounded-2xl p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/50 text-center mb-6">
              TRUSTED BY REPAIR SHOPS USING AI DAILY
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                  500+
                </div>
                <div className="text-xs text-white/50">Active Shops</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                  50K+
                </div>
                <div className="text-xs text-white/50">Repairs</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                  99%
                </div>
                <div className="text-xs text-white/50">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Success Card */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-12 bg-[#0a0a0f]">
          <div className="w-full max-w-[440px]">
            <div className="bg-[rgba(18,18,26,0.8)] backdrop-blur-[20px] border border-white/8 rounded-3xl p-12 shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent opacity-50" />
              
              <div className="w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-semibold font-['Space_Grotesk'] text-white mb-3">
                Check your email
              </h2>
              <p className="text-[0.9375rem] text-white/70 leading-relaxed mb-4">
                If your email exists, you&apos;ll receive a link.
              </p>
              <p className="text-xs text-white/50 mb-8">
                Check your inbox and spam folder. The link expires in 15 minutes.
              </p>
              
              <Link href="/login">
                <button className="w-full py-4 px-4 text-base font-semibold bg-gradient-to-r from-[#a78bfa] to-[#06b6d4] border-none rounded-[10px] text-white cursor-pointer transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/30">
                  Back to log in
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-center px-12 py-16 bg-[#0a0a0f] relative">
        <Link href="/" className="flex items-center gap-3 mb-12 text-white no-underline group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
            🔧
          </div>
          <span className="text-2xl font-bold font-['Space_Grotesk'] tracking-tight">Fixology</span>
        </Link>
        
        <h1 className="text-4xl font-bold font-['Space_Grotesk'] text-white mb-4 leading-tight tracking-tight">
          Built for repair shops.
        </h1>
        <p className="text-lg text-white/70 mb-12 leading-relaxed">
          AI that runs your repair business. Stop guessing. Start diagnosing.
        </p>
        
        <ul className="space-y-6 mb-16">
          <li className="flex items-center gap-4 text-white">
            <span className="text-2xl">⚡</span>
            <span>Faster diagnostics.</span>
          </li>
          <li className="flex items-center gap-4 text-white">
            <span className="text-2xl">📈</span>
            <span>Smarter inventory.</span>
          </li>
          <li className="flex items-center gap-4 text-white">
            <span className="text-2xl">🛡️</span>
            <span>Fewer repeat repairs.</span>
          </li>
        </ul>

        {/* Social Proof */}
        <div className="mt-auto bg-[#12121a] border border-white/8 rounded-2xl p-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50 text-center mb-6">
            TRUSTED BY REPAIR SHOPS USING AI DAILY
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                500+
              </div>
              <div className="text-xs text-white/50">Active Shops</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                50K+
              </div>
              <div className="text-xs text-white/50">Repairs</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-br from-[#a78bfa] to-[#06b6d4] bg-clip-text text-transparent mb-1">
                99%
              </div>
              <div className="text-xs text-white/50">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Card */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-12 bg-[#0a0a0f]">
        <div className="w-full max-w-[440px]">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/70 text-sm mb-6 hover:text-[#a78bfa] transition-colors no-underline">
            <ArrowLeft className="w-4 h-4" />
            Back to log in
          </Link>
          
          <div className="bg-[rgba(18,18,26,0.8)] backdrop-blur-[20px] border border-white/8 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent opacity-50" />
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-8">
              <h1 className="text-3xl font-semibold font-['Space_Grotesk'] text-white mb-2 tracking-tight">
                Reset your password
              </h1>
              <p className="text-[0.9375rem] text-white/70 leading-relaxed">
                Enter the email associated with your Fixology account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
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
                    className="w-full pl-11 pr-4 py-3.5 text-base bg-[#0a0a0f] border border-white/8 rounded-[10px] text-white placeholder-white/50 transition-all focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValidEmail(email)}
                className="w-full py-4 px-4 text-base font-semibold bg-gradient-to-r from-[#a78bfa] to-[#06b6d4] border-none rounded-[10px] text-white cursor-pointer transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>

              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mt-4 flex items-start gap-2 text-xs text-white/70">
                <span>🔒</span>
                <span>We&apos;ll email you a secure reset link. No passwords are shared. Secure reset link expires in 15 minutes.</span>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-[0.9375rem] text-white/70">
            Remembered it? <Link href="/login" className="text-[#a78bfa] hover:underline">Log in</Link> | <Link href="/contact" className="text-[#a78bfa] hover:underline">Need help?</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

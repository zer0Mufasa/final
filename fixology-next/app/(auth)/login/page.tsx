'use client'

// app/(auth)/login/page.tsx
// Login page with premium two-column layout

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Zap, TrendingUp, Shield } from 'lucide-react'
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
        <div className="w-full max-w-[440px] animate-[fadeInUp_0.5s_ease-out]">
          <div className="bg-[rgba(18,18,26,0.8)] backdrop-blur-[20px] border border-white/8 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent opacity-50" />
            
            <div id="error-message" className="hidden mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"></div>
            <div id="success-message" className="hidden mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"></div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold font-['Space_Grotesk'] text-white mb-2 tracking-tight">
                Welcome back
              </h1>
              <p className="text-[0.9375rem] text-white/70 leading-relaxed">
                Log in to your Fixology dashboard.
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
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 text-base bg-[#0a0a0f] border border-white/8 rounded-[10px] text-white placeholder-white/50 transition-all focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/15"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
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
                    className="w-full pl-11 pr-4 py-3.5 text-base bg-[#0a0a0f] border border-white/8 rounded-[10px] text-white placeholder-white/50 transition-all focus:outline-none focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/15"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/8 bg-[#0a0a0f] text-[#a78bfa] focus:ring-[#a78bfa]/20 accent-[#a78bfa] cursor-pointer"
                  />
                  <span className="text-sm text-white/70">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#a78bfa] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 text-base font-semibold bg-gradient-to-r from-[#a78bfa] to-[#06b6d4] border-none rounded-[10px] text-white cursor-pointer transition-all flex items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[0.9375rem] text-white/70">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-[#a78bfa] no-underline font-medium hover:underline transition-colors"
              >
                Sign up
              </Link>
            </p>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/50">
              <span>🔒</span>
              <span>We never share your data</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

const cn = (...c: (string | boolean | null | undefined)[]) => c.filter(Boolean).join(' ')

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || `Login failed (${res.status})`)
      }
      router.replace('/admin')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/20 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30 mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fixology Admin</h1>
          <p className="text-white/50 mt-1">Sign in to access the CEO dashboard</p>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.1] backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fixology.io"
                  required
                  className={cn(
                    'w-full pl-12 pr-4 py-3.5 rounded-xl',
                    'bg-white/[0.03] border border-white/[0.08]',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05]',
                    'transition-all'
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className={cn(
                    'w-full pl-12 pr-12 py-3.5 rounded-xl',
                    'bg-white/[0.03] border border-white/[0.08]',
                    'text-white placeholder:text-white/30',
                    'focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05]',
                    'transition-all'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3.5 rounded-xl font-semibold text-white',
                'bg-gradient-to-r from-violet-500 to-fuchsia-500',
                'hover:from-violet-600 hover:to-fuchsia-600',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                'transition-all duration-200 flex items-center justify-center gap-2',
                'shadow-lg shadow-violet-500/25',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Requires `ADMIN_JWT_SECRET` and a matching `PlatformAdmin` record in the database.
        </p>
      </div>
    </div>
  )
}


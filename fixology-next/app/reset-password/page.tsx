'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toaster'

function parseHashTokens(hash: string) {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  const sp = new URLSearchParams(h)
  const access_token = sp.get('access_token') || ''
  const refresh_token = sp.get('refresh_token') || ''
  const type = sp.get('type') || ''
  return { access_token, refresh_token, type }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [stage, setStage] = useState<'verifying' | 'ready' | 'done' | 'invalid'>('verifying')
  const [error, setError] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setStage('verifying')
      setError('')

      // 1) Supabase recovery links often come with tokens in the URL hash.
      const { access_token, refresh_token, type } = parseHashTokens(window.location.hash || '')
      if (access_token && refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
        if (setErr) {
          if (!cancelled) {
            setError(setErr.message || 'Reset link is invalid or expired.')
            setStage('invalid')
          }
          return
        }

        // Only proceed if this is a recovery flow (best-effort).
        if (!cancelled) {
          if (type && type !== 'recovery') {
            setError('This link is not a password recovery link.')
            setStage('invalid')
          } else {
            setStage('ready')
          }
        }
        return
      }

      // 2) Some Supabase setups use `?code=` flows.
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exErr) {
          if (!cancelled) {
            setError(exErr.message || 'Reset link is invalid or expired.')
            setStage('invalid')
          }
          return
        }
        if (!cancelled) setStage('ready')
        return
      }

      if (!cancelled) {
        setError('Reset link is missing required tokens. Please request a new reset email.')
        setStage('invalid')
      }
    }

    run().catch((e) => {
      if (!cancelled) {
        setError(String((e as any)?.message || e || 'Failed to verify reset link'))
        setStage('invalid')
      }
    })

    return () => {
      cancelled = true
    }
  }, [supabase])

  const canSubmit = password.length >= 8 && password === confirm && !saving

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    try {
      const { error: upErr } = await supabase.auth.updateUser({ password })
      if (upErr) throw upErr
      toast.success('Password updated. Please log in.')
      setStage('done')
      router.replace('/login?reset=success')
    } catch (err: any) {
      setError(err?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <div className="mx-auto max-w-lg px-6 py-20">
        <div className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white text-sm">
            ← Back to Fixology
          </Link>
        </div>

        {stage === 'verifying' && (
          <div className="rounded-3xl bg-white/[0.04] border border-white/[0.10] p-8">
            <div className="text-xl font-semibold">Verifying your reset link…</div>
            <div className="mt-2 text-white/60 text-sm">This should only take a moment.</div>
          </div>
        )}

        {stage === 'invalid' && (
          <div className="rounded-3xl bg-rose-500/10 border border-rose-500/30 p-8">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <AlertCircle className="w-5 h-5" />
              Reset link invalid
            </div>
            <div className="mt-2 text-rose-200/80 text-sm">{error}</div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/forgot-password"
                className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Request a new reset link
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Back to login
              </Link>
            </div>
          </div>
        )}

        {stage === 'ready' && (
          <div className="rounded-3xl bg-white/[0.04] border border-white/[0.10] p-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-violet-200" />
              </div>
              <div>
                <div className="text-xl font-semibold">Set a new password</div>
                <div className="text-sm text-white/60">Minimum 8 characters.</div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                  autoComplete="new-password"
                />
                {confirm && password !== confirm && (
                  <div className="mt-2 text-xs text-rose-300">Passwords do not match.</div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold"
              >
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {stage === 'done' && (
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-8">
            <div className="flex items-center gap-2 text-emerald-200 font-semibold">
              <CheckCircle className="w-5 h-5" />
              Password updated
            </div>
            <div className="mt-2 text-emerald-100/70 text-sm">Redirecting you to login…</div>
          </div>
        )}
      </div>
    </div>
  )
}


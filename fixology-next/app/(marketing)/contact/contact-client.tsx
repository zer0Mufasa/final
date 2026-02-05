'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MarketingNav } from '@/components/marketing/mobile-nav'

export function ContactClient() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    message: '',
  })

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          shopName: form.shopName,
          message: form.message,
          honey: '', // honeypot
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-white/60 hover:text-white/80">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-4xl font-bold">Contact Fixology</h1>
          <p className="mt-3 text-white/60">Tell us what you need and we’ll get back to you.</p>
        </div>

        {sent ? (
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-emerald-100">
            <div className="text-xl font-semibold text-white">Message received</div>
            <div className="mt-2 text-sm text-white/70">Thanks — we’ll follow up within 1 business day.</div>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl bg-white/[0.04] border border-white/[0.10] p-8 space-y-4">
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  type="email"
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Shop name (optional)</label>
                <input
                  value={form.shopName}
                  onChange={(e) => update('shopName', e.target.value)}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                className="w-full min-h-[140px] rounded-xl bg-white/[0.03] border border-white/[0.10] px-4 py-3 outline-none focus:border-violet-500/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold"
            >
              {loading ? 'Sending…' : 'Send message'}
            </button>

            <div className="text-xs text-white/40">
              This form sends via Resend. Make sure `RESEND_API_KEY`, `CONTACT_TO`, and `CONTACT_FROM` are set.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}


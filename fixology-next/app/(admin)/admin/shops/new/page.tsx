'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { ArrowLeft, Plus } from 'lucide-react'

export default function AdminNewShopPage() {
  const router = useRouter()
  const [shopName, setShopName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [plan, setPlan] = useState<'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'>('FREE')
  const [trialDays, setTrialDays] = useState(14)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(false)
  const [skipEmailVerification, setSkipEmailVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          ownerName,
          ownerEmail,
          ownerPhone,
          plan,
          trialDays,
          sendWelcomeEmail,
          skipEmailVerification,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
      router.push(`/admin/shops/${json.shop.id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to create shop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Shop"
        description="Provision a new shop tenant."
        kicker="Fixology Admin"
        action={
          <Link
            href="/admin/shops"
            className="px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        }
      />

      <GlassCard className="max-w-2xl">
        {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/55 mb-1">Shop name</label>
            <input
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/55 mb-1">Owner name</label>
            <input
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/55 mb-1">Owner email</label>
            <input
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/55 mb-1">Owner phone</label>
            <input
              className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-white/55 mb-1">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/55 mb-1">Trial days</label>
              <input
                type="number"
                min={1}
                className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value || 14))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={sendWelcomeEmail} onChange={(e) => setSendWelcomeEmail(e.target.checked)} />
              Send welcome email (best-effort)
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={skipEmailVerification} onChange={(e) => setSkipEmailVerification(e.target.checked)} />
              Skip email verification
            </label>
          </div>

          <button
            className="group px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Creating…' : 'Create shop'}
          </button>
        </form>
      </GlassCard>
    </div>
  )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { ArrowLeft, Copy, Mail, Phone, Play, RefreshCw, Shield, Trash2 } from 'lucide-react'

type Shop = {
  id: string
  name: string
  slug: string
  email: string
  phone?: string | null
  status: string
  plan: string
  trialEndsAt?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  createdAt?: string
  features?: any
  _count?: { users: number; tickets: number; customers: number; invoices: number }
}

type ShopUser = { id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null; createdAt: string }

type ShopNote = { id: string; content: string; createdAt: string; admin: { id: string; name: string; email: string } }

export function AdminShopDetailClient() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const shopId = params?.id

  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState<Shop | null>(null)
  const [users, setUsers] = useState<ShopUser[]>([])
  const [events, setEvents] = useState<Array<{ id: string; type: string; title: string; timestamp: string }>>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [notes, setNotes] = useState<ShopNote[]>([])
  const [noteDraft, setNoteDraft] = useState('')

  async function loadAll() {
    if (!shopId) return
    setLoading(true)
    try {
      const [sRes, uRes, aRes, bRes, nRes] = await Promise.all([
        fetch(`/api/admin/shops/${shopId}`, { cache: 'no-store' }),
        fetch(`/api/admin/shops/${shopId}/users`, { cache: 'no-store' }),
        fetch(`/api/admin/shops/${shopId}/activity`, { cache: 'no-store' }),
        fetch(`/api/admin/shops/${shopId}/billing`, { cache: 'no-store' }),
        fetch(`/api/admin/shops/${shopId}/notes`, { cache: 'no-store' }),
      ])
      const sJson = await sRes.json().catch(() => ({}))
      const uJson = await uRes.json().catch(() => ({}))
      const aJson = await aRes.json().catch(() => ({}))
      const bJson = await bRes.json().catch(() => ({}))
      const nJson = await nRes.json().catch(() => ({}))

      setShop(sJson?.shop || null)
      setUsers(Array.isArray(uJson?.users) ? uJson.users : [])
      setEvents(Array.isArray(aJson?.events) ? aJson.events : [])
      setInvoices(Array.isArray(bJson?.invoices) ? bJson.invoices : [])
      setNotes(Array.isArray(nJson?.notes) ? nJson.notes : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId])

  const owner = useMemo(() => users.find((u) => u.role === 'OWNER') || null, [users])

  async function action(kind: string) {
    if (!shopId || !shop) return
    if (kind === 'impersonate') {
      const res = await fetch(`/api/admin/shops/${shopId}/impersonate`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(json?.error || `Impersonation failed (${res.status})`)
        return
      }
      window.location.href = '/dashboard'
      return
    }
    if (kind === 'suspend') {
      const reason = window.prompt('Suspend reason (optional):', 'Suspended by admin') || 'Suspended by admin'
      await fetch(`/api/admin/shops/${shopId}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      await loadAll()
      return
    }
    if (kind === 'reactivate') {
      await fetch(`/api/admin/shops/${shopId}/reactivate`, { method: 'POST' })
      await loadAll()
      return
    }
    if (kind === 'extendTrial') {
      const days = window.prompt('Extend trial by how many days?', '7')
      if (!days) return
      await fetch(`/api/admin/shops/${shopId}/extend-trial`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days: Number(days) }) })
      await loadAll()
      return
    }
    if (kind === 'changePlan') {
      const next = window.prompt('Enter plan (FREE/STARTER/PRO/ENTERPRISE):', shop.plan)
      if (!next) return
      await fetch(`/api/admin/shops/${shopId}/change-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: next }) })
      await loadAll()
      return
    }
    if (kind === 'applyCredit') {
      const amount = window.prompt('Credit amount (cents, negative allowed):', '1000')
      if (!amount) return
      await fetch(`/api/admin/shops/${shopId}/apply-credit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountCents: Number(amount), reason: 'Admin credit' }) })
      await loadAll()
      return
    }
    if (kind === 'cancel') {
      const confirm = window.prompt(`Type the shop name to cancel this shop (${shop.name}):`, '')
      if (confirm !== shop.name) return
      await fetch(`/api/admin/shops/${shopId}`, { method: 'DELETE' })
      router.push('/admin/shops')
      return
    }
  }

  async function addNote() {
    if (!shopId) return
    const content = noteDraft.trim()
    if (!content) return
    const res = await fetch(`/api/admin/shops/${shopId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      window.alert(json?.error || `Failed to add note (${res.status})`)
      return
    }
    setNoteDraft('')
    await loadAll()
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shop" kicker="Fixology Admin" description={loading ? 'Loading…' : 'Not found'} />
      </div>
    )
  }

  const features = (shop.features as any) || {}
  const creditCents = Number(features.adminCreditBalanceCents || 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={shop.name}
        kicker="Shop"
        description={`/${shop.slug} • ${shop.status} • ${shop.plan}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/shops"
              className="px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button
              onClick={() => navigator.clipboard.writeText(shop.id)}
              className="px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
            >
              <Copy className="w-4 h-4" />
              Copy ID
            </button>
            <button
              onClick={() => action('impersonate')}
              className="group px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Play className="w-4 h-4" />
              Impersonate
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white/90 mb-4">Shop overview</h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-xs text-white/45">Status</div>
              <div className="mt-1 font-semibold text-white/85">{shop.status}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-xs text-white/45">Plan</div>
              <div className="mt-1 font-semibold text-white/85">{shop.plan}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-xs text-white/45">Trial ends</div>
              <div className="mt-1 font-semibold text-white/85">{shop.trialEndsAt ? new Date(shop.trialEndsAt).toLocaleString() : '—'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="text-xs text-white/45">Admin credit balance</div>
              <div className="mt-1 font-semibold text-white/85">${(creditCents / 100).toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => action('extendTrial')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-300" />
              Extend trial
            </button>
            <button onClick={() => action('changePlan')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] inline-flex items-center gap-2">
              Change plan
            </button>
            <button onClick={() => action('applyCredit')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] inline-flex items-center gap-2">
              Apply credit
            </button>
            {shop.status === 'SUSPENDED' || shop.status === 'CANCELLED' ? (
              <button onClick={() => action('reactivate')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15 inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-300" />
                Reactivate
              </button>
            ) : (
              <button onClick={() => action('suspend')} className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 inline-flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-300" />
                Suspend
              </button>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Owner</h3>
          <div className="space-y-2 text-sm">
            <div className="text-white/80 font-semibold">{owner?.name || '—'}</div>
            <div className="text-white/55">{owner?.email || shop.email}</div>
            <div className="text-white/55">{shop.phone || '—'}</div>
            <div className="flex items-center gap-2 mt-3">
              <a
                href={`mailto:${owner?.email || shop.email}`}
                className="px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] inline-flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4 text-violet-300" />
                Email
              </a>
              {shop.phone ? (
                <a
                  href={`tel:${shop.phone}`}
                  className="px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] inline-flex items-center gap-2 text-sm"
                >
                  <Phone className="w-4 h-4 text-violet-300" />
                  Call
                </a>
              ) : null}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Team members</h3>
              <p className="text-sm text-white/45">{users.length} users</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50">
                  <th className="text-left font-medium py-3 px-6">Name</th>
                  <th className="text-left font-medium py-3 px-6">Email</th>
                  <th className="text-left font-medium py-3 px-6">Role</th>
                  <th className="text-left font-medium py-3 px-6">Last login</th>
                  <th className="text-left font-medium py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-6 font-semibold text-white/85">{u.name}</td>
                    <td className="py-3 px-6 text-white/70">{u.email}</td>
                    <td className="py-3 px-6 text-white/60">{u.role}</td>
                    <td className="py-3 px-6 text-white/60">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                    <td className="py-3 px-6 text-white/60">{u.status}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 px-6 text-center text-white/45">
                      No users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Internal notes</h3>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add an internal note…"
            className="w-full min-h-[110px] p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={addNote}
              className="group px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              Add note
            </button>
            <div className="text-xs text-white/40">{notes.length} notes</div>
          </div>
          <div className="mt-4 space-y-3">
            {notes.slice(0, 6).map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-sm text-white/85 whitespace-pre-wrap">{n.content}</div>
                <div className="mt-2 text-xs text-white/40">
                  {n.admin?.name || n.admin?.email || 'Admin'} • {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {notes.length === 0 && <div className="text-sm text-white/45">No notes yet.</div>}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">Billing history (POS)</h3>
            <p className="text-sm text-white/45">Invoices & recorded payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50">
                  <th className="text-left font-medium py-3 px-6">Invoice</th>
                  <th className="text-left font-medium py-3 px-6">Status</th>
                  <th className="text-left font-medium py-3 px-6">Amount</th>
                  <th className="text-left font-medium py-3 px-6">Created</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 20).map((inv) => (
                  <tr key={inv.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-6 text-white/80 font-semibold">{inv.invoiceNumber}</td>
                    <td className="py-3 px-6 text-white/60">{inv.status}</td>
                    <td className="py-3 px-6 text-white/80">${Number(inv.total).toFixed(2)}</td>
                    <td className="py-3 px-6 text-white/60">{new Date(inv.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 px-6 text-center text-white/45">
                      No invoices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">Activity timeline</h3>
            <p className="text-sm text-white/45">Tickets, invoices, admin actions, operational events</p>
          </div>
          <div className={cn('p-6 space-y-3', loading && 'opacity-60')}>
            {events.slice(0, 20).map((e) => (
              <div key={e.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-sm text-white/85">{e.title}</div>
                <div className="text-xs text-white/40 mt-1">{new Date(e.timestamp).toLocaleString()}</div>
              </div>
            ))}
            {events.length === 0 && <div className="text-sm text-white/45">No events.</div>}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-rose-300" />
          <h3 className="text-lg font-semibold text-white/90">Danger zone</h3>
        </div>
        <p className="text-sm text-white/45 mb-4">These actions are destructive and will be logged.</p>
        <button
          onClick={() => action('cancel')}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 inline-flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4 text-rose-300" />
          Cancel shop
        </button>
      </GlassCard>
    </div>
  )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Store,
  Trash2,
} from 'lucide-react'

type ShopRow = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  mrr: number
  healthScore: number
  lastActiveAt: string | null
  createdAt: string
  owner: { id: string; name: string; email: string; phone: string | null } | null
  counts: { users: number; tickets: number; customers: number }
}

type ShopsResponse = { shops: ShopRow[]; page: number; pageSize: number; total: number }

function pill(variant: 'violet' | 'emerald' | 'amber' | 'rose' | 'slate') {
  const map = {
    violet: 'bg-violet-500/15 border-violet-500/25 text-violet-200',
    emerald: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
    amber: 'bg-amber-500/15 border-amber-500/25 text-amber-200',
    rose: 'bg-rose-500/15 border-rose-500/25 text-rose-200',
    slate: 'bg-white/[0.06] border-white/[0.10] text-white/70',
  } as const
  return cn('inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border', map[variant])
}

function statusPill(status: string) {
  switch (status) {
    case 'ACTIVE':
      return pill('emerald')
    case 'TRIAL':
      return pill('amber')
    case 'PAST_DUE':
    case 'SUSPENDED':
      return pill('rose')
    case 'CANCELLED':
      return pill('slate')
    default:
      return pill('slate')
  }
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export function AdminShopsClient() {
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'All' | 'Active' | 'Trial' | 'At-Risk' | 'Suspended' | 'Churned'>('All')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort, setSort] = useState<'createdAt' | 'name' | 'status' | 'plan'>('createdAt')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [data, setData] = useState<ShopsResponse>({ shops: [], page: 1, pageSize: 25, total: 0 })
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected])

  const qs = useMemo(() => {
    const sp = new URLSearchParams()
    if (q.trim()) sp.set('q', q.trim())
    if (tab !== 'All') sp.set('tab', tab)
    if (plan) sp.set('plan', plan)
    sp.set('page', String(page))
    sp.set('pageSize', String(pageSize))
    sp.set('sort', sort)
    sp.set('dir', dir)
    return sp.toString()
  }, [q, tab, plan, page, pageSize, sort, dir])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/shops?${qs}`, { cache: 'no-store' })
      const json = await res.json()
      setData({
        shops: Array.isArray(json?.shops) ? json.shops : [],
        page: Number(json?.page || 1),
        pageSize: Number(json?.pageSize || pageSize),
        total: Number(json?.total || 0),
      })
      setSelected({})
      setMenuOpenId(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const pageCount = Math.max(1, Math.ceil((data.total || 0) / pageSize))

  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {}
    for (const s of data.shops) next[s.id] = v
    setSelected(next)
  }

  async function bulkSuspend() {
    const ids = selectedIds
    if (ids.length === 0) return
    const reason = window.prompt('Suspend reason (optional):', 'Suspended by admin') || 'Suspended by admin'
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/admin/shops/${id}/suspend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      )
    )
    await load()
  }

  function exportSelectedCsv() {
    const ids = new Set(selectedIds)
    const rows = data.shops.filter((s) => ids.has(s.id))
    const header = ['id', 'name', 'slug', 'status', 'plan', 'mrr', 'users', 'tickets', 'healthScore', 'lastActiveAt', 'createdAt', 'ownerName', 'ownerEmail']
    const lines = [header.join(',')]
    for (const s of rows) {
      const line = [
        s.id,
        `"${s.name.replace(/"/g, '""')}"`,
        s.slug,
        s.status,
        s.plan,
        String(s.mrr),
        String(s.counts.users),
        String(s.counts.tickets),
        String(s.healthScore),
        s.lastActiveAt || '',
        s.createdAt,
        `"${(s.owner?.name || '').replace(/"/g, '""')}"`,
        s.owner?.email || '',
      ]
      lines.push(line.join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shops.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function rowAction(shop: ShopRow, action: string) {
    setMenuOpenId(null)
    if (action === 'impersonate') {
      const res = await fetch(`/api/admin/shops/${shop.id}/impersonate`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(json?.error || `Impersonation failed (${res.status})`)
        return
      }
      window.location.href = '/dashboard'
      return
    }
    if (action === 'suspend') {
      const reason = window.prompt('Suspend reason (optional):', 'Suspended by admin') || 'Suspended by admin'
      await fetch(`/api/admin/shops/${shop.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      await load()
      return
    }
    if (action === 'reactivate') {
      await fetch(`/api/admin/shops/${shop.id}/reactivate`, { method: 'POST' })
      await load()
      return
    }
    if (action === 'extendTrial') {
      const days = window.prompt('Extend trial by how many days?', '7')
      if (!days) return
      await fetch(`/api/admin/shops/${shop.id}/extend-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: Number(days) }),
      })
      await load()
      return
    }
    if (action === 'changePlan') {
      const next = window.prompt('Enter plan (FREE/STARTER/PRO/ENTERPRISE):', shop.plan)
      if (!next) return
      await fetch(`/api/admin/shops/${shop.id}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: next }),
      })
      await load()
      return
    }
    if (action === 'applyCredit') {
      const amount = window.prompt('Credit amount (cents, negative allowed):', '1000')
      if (!amount) return
      await fetch(`/api/admin/shops/${shop.id}/apply-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Number(amount), reason: 'Admin credit' }),
      })
      await load()
      return
    }
    if (action === 'delete') {
      const confirm = window.prompt(`Type the shop name to cancel this shop (${shop.name}):`, '')
      if (confirm !== shop.name) return
      await fetch(`/api/admin/shops/${shop.id}`, { method: 'DELETE' })
      await load()
      return
    }
    if (action === 'copyId') {
      await navigator.clipboard.writeText(shop.id)
      return
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shops"
        kicker="Fixology Admin"
        description={`${data.total.toLocaleString()} total shops`}
        action={
          <Link
            href="/admin/shops/new"
            className="group px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            <Plus className="w-4 h-4" />
            New shop
          </Link>
        }
      />

      <GlassCard>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <input
              value={q}
              onChange={(e) => {
                setPage(1)
                setQ(e.target.value)
              }}
              placeholder="Search name, owner email, phone..."
              className="w-full md:max-w-md h-10 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15"
            />
            <div className="flex items-center gap-2">
              <select
                value={plan}
                onChange={(e) => {
                  setPage(1)
                  setPlan(e.target.value)
                }}
                className="h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm"
              >
                <option value="">All plans</option>
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1)
                  setPageSize(Number(e.target.value))
                }}
                className="h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {(['All', 'Active', 'Trial', 'At-Risk', 'Suspended', 'Churned'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setPage(1)
                    setTab(t)
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    tab === t ? 'bg-violet-500/15 border-violet-500/25 text-violet-200' : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/80'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={bulkSuspend}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                >
                  Bulk suspend ({selectedIds.length})
                </button>
                <button
                  onClick={exportSelectedCsv}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/[0.10] bg-white/[0.04] text-white/75 hover:bg-white/[0.06]"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={data.shops.length > 0 && selectedIds.length === data.shops.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                {[
                  { k: 'name', label: 'Name' },
                  { k: 'status', label: 'Status' },
                  { k: 'plan', label: 'Plan' },
                  { k: 'createdAt', label: 'Created' },
                ].map((h) => (
                  <th key={h.k} className="text-left font-medium py-3 px-6">
                    <button
                      onClick={() => {
                        const nextSort = h.k as any
                        if (sort === nextSort) setDir(dir === 'asc' ? 'desc' : 'asc')
                        else setSort(nextSort)
                      }}
                      className="inline-flex items-center gap-1 hover:text-white/80"
                    >
                      {h.label}
                      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', sort === h.k && dir === 'asc' && 'rotate-180')} />
                    </button>
                  </th>
                ))}
                <th className="text-left font-medium py-3 px-6">MRR</th>
                <th className="text-left font-medium py-3 px-6">Users</th>
                <th className="text-left font-medium py-3 px-6">Tickets</th>
                <th className="text-left font-medium py-3 px-6">Health</th>
                <th className="text-left font-medium py-3 px-6">Last active</th>
                <th className="text-right font-medium py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.shops.map((shop) => (
                <tr key={shop.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={!!selected[shop.id]}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [shop.id]: e.target.checked }))}
                    />
                  </td>
                  <td className="py-3 px-6">
                    <Link href={`/admin/shops/${shop.id}`} className="font-semibold text-white/85 hover:text-violet-300 transition-colors">
                      {shop.name}
                    </Link>
                    <div className="text-xs text-white/40">/{shop.slug}</div>
                    <div className="text-xs text-white/35">{shop.owner?.email || ''}</div>
                  </td>
                  <td className="py-3 px-6">
                    <span className={statusPill(shop.status)}>{shop.status}</span>
                  </td>
                  <td className="py-3 px-6 text-white/70">{shop.plan}</td>
                  <td className="py-3 px-6 text-white/60">{fmtDate(shop.createdAt)}</td>
                  <td className="py-3 px-6 text-white/80">{money(shop.mrr)}</td>
                  <td className="py-3 px-6 text-white/70">{shop.counts.users}</td>
                  <td className="py-3 px-6 text-white/70">{shop.counts.tickets}</td>
                  <td className="py-3 px-6">
                    <span className={shop.healthScore < 55 ? pill('rose') : shop.healthScore < 75 ? pill('amber') : pill('emerald')}>
                      {shop.healthScore}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-white/60">{shop.lastActiveAt ? new Date(shop.lastActiveAt).toLocaleDateString() : '—'}</td>
                  <td className="py-3 px-6 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenuOpenId((v) => (v === shop.id ? null : shop.id))}
                        className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
                      >
                        <MoreHorizontal className="w-4 h-4 text-white/70" />
                      </button>
                      {menuOpenId === shop.id && (
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.10] bg-[rgba(10,10,14,0.96)] backdrop-blur-xl shadow-2xl p-2 z-20">
                          <Link
                            href={`/admin/shops/${shop.id}`}
                            className="block px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06]"
                            onClick={() => setMenuOpenId(null)}
                          >
                            View details
                          </Link>
                          <button
                            onClick={() => rowAction(shop, 'impersonate')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] inline-flex items-center gap-2"
                          >
                            <Play className="w-4 h-4 text-violet-300" />
                            Impersonate
                          </button>
                          <button
                            onClick={() => rowAction(shop, 'extendTrial')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] inline-flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4 text-amber-300" />
                            Extend trial
                          </button>
                          <button
                            onClick={() => rowAction(shop, 'changePlan')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] inline-flex items-center gap-2"
                          >
                            <Store className="w-4 h-4 text-white/70" />
                            Change plan
                          </button>
                          <button
                            onClick={() => rowAction(shop, 'applyCredit')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/75 hover:bg-white/[0.06] inline-flex items-center gap-2"
                          >
                            <CreditIcon />
                            Apply credit
                          </button>

                          {shop.status === 'SUSPENDED' || shop.status === 'CANCELLED' ? (
                            <button
                              onClick={() => rowAction(shop, 'reactivate')}
                              className="w-full text-left px-3 py-2 rounded-xl text-sm text-emerald-200 hover:bg-white/[0.06] inline-flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4 text-emerald-300" />
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => rowAction(shop, 'suspend')}
                              className="w-full text-left px-3 py-2 rounded-xl text-sm text-rose-200 hover:bg-white/[0.06] inline-flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4 text-rose-300" />
                              Suspend
                            </button>
                          )}

                          <div className="my-2 h-px bg-white/[0.06]" />
                          <button
                            onClick={() => rowAction(shop, 'copyId')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/[0.06] inline-flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4 text-white/50" />
                            Copy shop ID
                          </button>
                          <button
                            onClick={() => rowAction(shop, 'delete')}
                            className="w-full text-left px-3 py-2 rounded-xl text-sm text-rose-200 hover:bg-rose-500/10 inline-flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4 text-rose-300" />
                            Cancel shop…
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.shops.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 px-6 text-center text-white/45">
                    No shops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="flex items-center justify-between">
        <div className="text-sm text-white/50">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CreditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-violet-300">
      <path
        d="M3 7h18M5 11h14M7 15h10M9 19h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}


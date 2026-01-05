'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils/cn'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { StatCard } from '@/components/admin/ui/stat-card'
import { Activity, AlertTriangle, ArrowRight, Bell, CreditCard, Flag, Plus, Store, Users } from 'lucide-react'

type AdminStats = {
  shops: {
    total: number
    active: number
    trial: number
    suspended: number
    cancelled: number
    newThisMonth: number
    newThisWeek: number
  }
  users: { total: number; activeToday: number; activeThisWeek: number }
  revenue: {
    mrr: number
    arr: number
    mrrChangePct: number | null
    churnRatePct: number | null
    nrrPct: number | null
    arpu: number | null
    ltv: number | null
    cac: number | null
    trialToPaidConversionPct: number | null
  }
}

type MrrPoint = { month: string; mrr: number; newMrr: number; churnedMrr: number; signups: number }

type ActivityEvent = {
  id: string
  type: string
  title: string
  timestamp: string
  link?: string
}

type AtRisk = {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  lastActiveAt: string | null
  healthScore: number
  reason: string
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`
}

function fmtTs(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString()
}

export function AdminDashboardClient() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [mrr, setMrr] = useState<MrrPoint[]>([])
  const [mrrByPlan, setMrrByPlan] = useState<{ rows: Array<{ plan: string; shops: number; mrr: number; percent: number }> } | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [activityCursor, setActivityCursor] = useState<string | null>(null)
  const [activityType, setActivityType] = useState<string>('')
  const [atRisk, setAtRisk] = useState<AtRisk[]>([])
  const [expiringTrials, setExpiringTrials] = useState<Array<{ id: string; name: string; slug: string; trialEndsAt: string | null }>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sRes, mRes, pRes, aRes, rRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/admin/stats/mrr-history', { cache: 'no-store' }),
          fetch('/api/admin/billing/mrr-by-plan', { cache: 'no-store' }),
          fetch('/api/admin/stats/activity-feed?limit=20', { cache: 'no-store' }),
          fetch('/api/admin/stats/at-risk-shops?limit=8', { cache: 'no-store' }),
        ])

        const sJson = await sRes.json()
        const mJson = await mRes.json()
        const pJson = await pRes.json()
        const aJson = await aRes.json()
        const rJson = await rRes.json()

        if (cancelled) return
        setStats(sJson)
        setMrr(Array.isArray(mJson?.points) ? mJson.points : [])
        setMrrByPlan(pJson)
        setActivity(Array.isArray(aJson?.events) ? aJson.events : [])
        setActivityCursor(typeof aJson?.nextCursor === 'string' ? aJson.nextCursor : null)
        setAtRisk(Array.isArray(rJson?.atRisk) ? rJson.atRisk : [])
        setExpiringTrials(Array.isArray(rJson?.expiringTrials) ? rJson.expiringTrials : [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const planPie = useMemo(() => {
    const rows = mrrByPlan?.rows || []
    return rows.map((r) => ({ name: r.plan, value: r.mrr }))
  }, [mrrByPlan])

  const planColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'rgba(255,255,255,0.35)'
      case 'STARTER':
        return 'rgba(59,130,246,0.65)'
      case 'PRO':
        return 'rgba(167,139,250,0.75)'
      case 'ENTERPRISE':
        return 'rgba(192,38,211,0.65)'
      default:
        return 'rgba(255,255,255,0.35)'
    }
  }

  const stacked = useMemo(() => {
    return mrr.map((p) => ({ month: p.month.slice(5), newMrr: p.newMrr, churnedMrr: p.churnedMrr }))
  }, [mrr])

  const signups = useMemo(() => {
    return mrr.map((p) => ({ month: p.month.slice(5), signups: p.signups }))
  }, [mrr])

  async function loadMoreActivity() {
    if (!activityCursor) return
    const qs = new URLSearchParams()
    qs.set('limit', '20')
    qs.set('cursor', activityCursor)
    if (activityType) qs.set('type', activityType)
    const res = await fetch(`/api/admin/stats/activity-feed?${qs.toString()}`, { cache: 'no-store' })
    const json = await res.json()
    const next = Array.isArray(json?.events) ? json.events : []
    setActivity((prev) => [...prev, ...next])
    setActivityCursor(typeof json?.nextCursor === 'string' ? json.nextCursor : null)
  }

  async function applyActivityFilter(nextType: string) {
    setActivityType(nextType)
    const qs = new URLSearchParams()
    qs.set('limit', '20')
    if (nextType) qs.set('type', nextType)
    const res = await fetch(`/api/admin/stats/activity-feed?${qs.toString()}`, { cache: 'no-store' })
    const json = await res.json()
    setActivity(Array.isArray(json?.events) ? json.events : [])
    setActivityCursor(typeof json?.nextCursor === 'string' ? json.nextCursor : null)
  }

  const mrrChange = stats?.revenue.mrrChangePct

  return (
    <div className="space-y-6">
      <PageHeader
        title="CEO Dashboard"
        kicker="Fixology Admin"
        description="Real-time platform metrics, alerts, and operational activity."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/shops/new"
              className="group px-5 py-2.5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Plus className="w-4 h-4" />
              Add Shop
            </Link>
          </div>
        }
      />

      {/* Metric cards */}
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', loading && 'opacity-60')}>
        <StatCard
          tone="violet"
          label="MRR"
          value={stats ? money(stats.revenue.mrr) : '—'}
          subValue={mrrChange === null || mrrChange === undefined ? 'Change: —' : `Change: ${mrrChange > 0 ? '+' : ''}${mrrChange}% vs last month`}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard tone="default" label="ARR" value={stats ? money(stats.revenue.arr) : '—'} icon={<CreditCard className="w-5 h-5" />} />
        <StatCard
          tone="emerald"
          label="Total Shops"
          value={stats ? stats.shops.total : '—'}
          subValue={stats ? `Active ${stats.shops.active} • Trial ${stats.shops.trial} • Susp ${stats.shops.suspended} • Churn ${stats.shops.cancelled}` : undefined}
          icon={<Store className="w-5 h-5" />}
        />
        <StatCard
          tone="default"
          label="Total Users"
          value={stats ? stats.users.total : '—'}
          subValue={stats ? `Active: ${stats.users.activeToday} today • ${stats.users.activeThisWeek} this week` : undefined}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard tone="amber" label="New signups (week)" value={stats ? stats.shops.newThisWeek : '—'} icon={<Activity className="w-5 h-5" />} />
        <StatCard tone="amber" label="New signups (month)" value={stats ? stats.shops.newThisMonth : '—'} icon={<Activity className="w-5 h-5" />} />
        <StatCard tone="default" label="NRR" value={stats?.revenue.nrrPct ?? '—'} subValue="Needs subscription history" />
        <StatCard tone="default" label="Churn rate" value={stats?.revenue.churnRatePct ?? '—'} subValue="Needs subscription history" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white/90">MRR growth</h3>
              <p className="text-sm text-white/45">Last 12 months (estimated from plan pricing)</p>
            </div>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrr}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} tickFormatter={(v) => String(v).slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.65)' }}
                  formatter={(val: any) => [`$${val}`, 'MRR']}
                />
                <Line type="monotone" dataKey="mrr" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">MRR by plan</h3>
            <p className="text-sm text-white/45">Distribution</p>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {(planPie || []).map((p, i) => (
                      <Cell key={i} fill={planColor(p.name)} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                  formatter={(val: any, name: any) => [`$${val}`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-6 pb-6 space-y-2">
            {(mrrByPlan?.rows || []).slice(0, 4).map((r) => (
              <div key={r.plan} className="flex items-center justify-between text-sm">
                <span className="text-white/60">{r.plan}</span>
                <span className="text-white/80">{money(r.mrr)} • {r.percent}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">New vs churned MRR</h3>
            <p className="text-sm text-white/45">Stacked by month</p>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="newMrr" stackId="a" fill="rgba(167,139,250,0.65)" />
                <Bar dataKey="churnedMrr" stackId="a" fill="rgba(244,63,94,0.55)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">Signups over time</h3>
            <p className="text-sm text-white/45">Last 12 months</p>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signups}>
                <defs>
                  <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(167, 139, 250, 0.55)" />
                    <stop offset="100%" stopColor="rgba(167, 139, 250, 0.05)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                />
                <Area type="monotone" dataKey="signups" stroke="#a78bfa" fill="url(#signupFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Activity + Alerts + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Activity feed</h3>
              <p className="text-sm text-white/45">New signups, payments, and admin actions</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { key: '', label: 'All' },
                { key: 'shop_signup', label: 'Signups' },
                { key: 'payment_received', label: 'Payments' },
                { key: 'admin_action', label: 'Admin' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => applyActivityFilter(t.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    activityType === t.key ? 'bg-violet-500/15 border-violet-500/25 text-violet-200' : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/80'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {activity.map((e) => (
              <Link
                key={e.id}
                href={e.link || '/admin/audit'}
                className="block p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-white/85">{e.title}</div>
                    <div className="text-xs text-white/40 mt-1">{fmtTs(e.timestamp)}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Link href="/admin/audit" className="text-sm text-violet-300 hover:text-violet-200 transition-colors">
              View audit log →
            </Link>
            <button
              onClick={loadMoreActivity}
              disabled={!activityCursor}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/[0.08] bg-white/[0.04] text-white/80 hover:bg-white/[0.06] disabled:opacity-50"
            >
              Load more
            </button>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <h3 className="text-lg font-semibold text-white/90">Alerts</h3>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/45 uppercase tracking-wider">At-risk shops</div>
              {atRisk.length === 0 ? (
                <div className="text-sm text-white/45">No at-risk shops detected.</div>
              ) : (
                atRisk.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/admin/shops/${s.id}`} className="block p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/85 truncate">{s.name}</div>
                        <div className="text-xs text-white/40 mt-1">{s.reason}</div>
                      </div>
                      <div className="text-xs font-bold text-rose-300">{s.healthScore}</div>
                    </div>
                  </Link>
                ))
              )}

              <div className="text-xs font-semibold text-white/45 uppercase tracking-wider mt-4">Trials expiring (3 days)</div>
              {expiringTrials.length === 0 ? (
                <div className="text-sm text-white/45">No expiring trials.</div>
              ) : (
                expiringTrials.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/admin/shops/${s.id}`} className="block p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/85 truncate">{s.name}</div>
                        <div className="text-xs text-white/40 mt-1">{s.trialEndsAt ? fmtTs(s.trialEndsAt) : '—'}</div>
                      </div>
                      <Bell className="w-4 h-4 text-amber-300 mt-0.5" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-white/90 mb-3">Quick actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/shops/new" className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Plus className="w-4 h-4 text-violet-300" />
                  Add shop
                </div>
              </Link>
              <Link href="/admin/announcements" className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Bell className="w-4 h-4 text-violet-300" />
                  Announce
                </div>
              </Link>
              <Link href="/admin/billing" className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <CreditCard className="w-4 h-4 text-violet-300" />
                  Billing
                </div>
              </Link>
              <Link href="/admin/features" className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Flag className="w-4 h-4 text-violet-300" />
                  Flags
                </div>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


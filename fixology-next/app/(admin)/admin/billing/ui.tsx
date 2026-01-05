'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { StatCard } from '@/components/admin/ui/stat-card'
import { CreditCard, ArrowRight, Receipt, TrendingUp } from 'lucide-react'

type BillingStats = {
  revenue: {
    mrr: number
    arr: number
    mrrChangePct: number | null
    netNewMrr: number
    revenue30d: number
    arpu: number | null
  }
}

export function AdminBillingClient() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [mrrByPlan, setMrrByPlan] = useState<{ rows: Array<{ plan: string; shops: number; mrr: number; percent: number }> } | null>(null)
  const [revenueChart, setRevenueChart] = useState<Array<{ month: string; revenue: number }>>([])
  const [transactions, setTransactions] = useState<Array<any>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sRes, pRes, rRes, tRes] = await Promise.all([
          fetch('/api/admin/billing/stats', { cache: 'no-store' }),
          fetch('/api/admin/billing/mrr-by-plan', { cache: 'no-store' }),
          fetch('/api/admin/billing/revenue-chart', { cache: 'no-store' }),
          fetch('/api/admin/billing/transactions?page=1&pageSize=20', { cache: 'no-store' }),
        ])

        const sJson = await sRes.json()
        const pJson = await pRes.json()
        const rJson = await rRes.json()
        const tJson = await tRes.json()

        if (cancelled) return
        setStats(sJson)
        setMrrByPlan(pJson)
        setRevenueChart(Array.isArray(rJson?.points) ? rJson.points : [])
        setTransactions(Array.isArray(tJson?.transactions) ? tJson.transactions : [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const mrrSeries = useMemo(() => {
    return (mrrByPlan?.rows || []).map((r) => ({ plan: r.plan, mrr: r.mrr }))
  }, [mrrByPlan])

  const money = (n: number) => `$${Math.round(n).toLocaleString()}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Revenue"
        kicker="Fixology Admin"
        description="MRR/ARR and revenue from POS invoices (Stripe subscription events coming next)."
        action={
          <Link
            href="/admin/shops"
            className="px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
          >
            View shops
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tone="violet"
          label="MRR"
          value={stats ? money(stats.revenue.mrr) : '—'}
          subValue={
            stats?.revenue.mrrChangePct === null || stats?.revenue.mrrChangePct === undefined
              ? 'Change: —'
              : `Change: ${stats.revenue.mrrChangePct > 0 ? '+' : ''}${stats.revenue.mrrChangePct}%`
          }
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard tone="default" label="ARR" value={stats ? money(stats.revenue.arr) : '—'} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard tone="emerald" label="Net new MRR (est.)" value={stats ? money(stats.revenue.netNewMrr) : '—'} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard tone="amber" label="Revenue (30d)" value={stats ? `$${stats.revenue.revenue30d.toFixed(2)}` : '—'} icon={<Receipt className="w-5 h-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">Revenue by month</h3>
            <p className="text-sm text-white/45">POS payments (invoices/payments)</p>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} tickFormatter={(v) => String(v).slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                  formatter={(val: any) => [`$${val}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden" hover={false}>
          <div className="p-6 border-b border-white/[0.06]">
            <h3 className="text-lg font-semibold text-white/90">MRR by plan</h3>
            <p className="text-sm text-white/45">Estimated</p>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="plan" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,14,0.92)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                  }}
                  formatter={(val: any) => [`$${val}`, 'MRR']}
                />
                <Bar dataKey="mrr" fill="rgba(167,139,250,0.65)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden" hover={false}>
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white/90">Transactions</h3>
            <p className="text-sm text-white/45">Latest POS payments recorded in the platform DB</p>
          </div>
          <Link href="/admin/billing" className="text-sm text-violet-300 hover:text-violet-200 transition-colors">
            View all →
          </Link>
        </div>

        <div className={loading ? 'opacity-60' : ''}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50">
                  <th className="text-left font-medium py-3 px-6">Date</th>
                  <th className="text-left font-medium py-3 px-6">Shop</th>
                  <th className="text-left font-medium py-3 px-6">Amount</th>
                  <th className="text-left font-medium py-3 px-6">Method</th>
                  <th className="text-left font-medium py-3 px-6">Invoice</th>
                  <th className="text-left font-medium py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-6 text-white/60">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-6">
                      <Link href={`/admin/shops/${t.shop.id}`} className="font-semibold text-white/85 hover:text-violet-300 transition-colors">
                        {t.shop.name}
                      </Link>
                    </td>
                    <td className="py-3 px-6 text-white/80">${Number(t.amount).toFixed(2)}</td>
                    <td className="py-3 px-6 text-white/60">{t.method}</td>
                    <td className="py-3 px-6 text-white/60">{t.invoice.invoiceNumber}</td>
                    <td className="py-3 px-6 text-emerald-300">{t.status}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 px-6 text-center text-white/45">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}


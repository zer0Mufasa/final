'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Payment, PaymentMethod, PaymentStatus } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Modal } from '@/components/dashboard/ui/modal'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  FileText,
  Filter,
  Search,
  Calendar,
  User,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Smartphone,
  Banknote,
  Wallet,
  Apple,
  MoreHorizontal,
  Send,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()
  
  if (d.toDateString() === today) return 'Today'
  if (d.toDateString() === yesterday) return 'Yesterday'
  
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff < 7) return `${diff}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const methodIcons: Record<PaymentMethod, string> = {
  'cash': '💵',
  'card': '💳',
  'card-manual': '💳',
  'apple-pay': '🍎',
  'google-pay': '📱',
  'cash-app': '💚',
  'venmo': '📲',
  'zelle': '💸',
  'check': '📝',
  'store-credit': '🎟️',
  'other': '📋',
}

const methodLabels: Record<PaymentMethod, string> = {
  'cash': 'Cash',
  'card': 'Card',
  'card-manual': 'Card (Manual)',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  'cash-app': 'Cash App',
  'venmo': 'Venmo',
  'zelle': 'Zelle',
  'check': 'Check',
  'store-credit': 'Store Credit',
  'other': 'Other',
}

const statusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  'pending': { label: 'Pending', color: 'bg-amber-500/15 text-amber-300 border border-amber-500/20' },
  'completed': { label: 'Paid', color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' },
  'failed': { label: 'Failed', color: 'bg-red-500/15 text-red-300 border border-red-500/20' },
  'refunded': { label: 'Refunded', color: 'bg-rose-500/15 text-rose-300 border border-rose-500/20' },
}

export function PaymentsHubPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'pending' | 'refunds'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
  const [recordOpen, setRecordOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])

  const refreshPayments = async () => {
    try {
      const res = await fetch('/api/payments', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setPayments(Array.isArray(data?.payments) ? data.payments : [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/payments', { cache: 'no-store' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load payments')
        }
        const data = await res.json()
        if (!cancelled) setPayments(Array.isArray(data?.payments) ? data.payments : [])
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load payments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    
    const todayPayments = payments.filter(p => 
      p.status === 'completed' && new Date(p.createdAt).toDateString() === today
    )
    const collectedToday = todayPayments.reduce((sum, p) => sum + p.totalAmount, 0)
    
    const weekStart = new Date(now.getTime() - 7 * 86400000)
    const weekPayments = payments.filter(p => 
      p.status === 'completed' && new Date(p.createdAt) >= weekStart
    )
    const collectedWeek = weekPayments.reduce((sum, p) => sum + p.totalAmount, 0)
    
    const outstanding = payments.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const transactionsToday = todayPayments.length
    
    return { collectedToday, collectedWeek, outstanding, transactionsToday }
  }, [payments])

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const completedPayments = payments.filter(p => p.status === 'completed')
    const total = completedPayments.reduce((sum, p) => sum + p.totalAmount, 0)
    
    const byMethod: Record<string, number> = {}
    completedPayments.forEach(p => {
      const category = p.method === 'cash' ? 'Cash' : 
                       p.method === 'card' || p.method === 'card-manual' || p.method === 'apple-pay' || p.method === 'google-pay' ? 'Card' : 
                       'Digital'
      byMethod[category] = (byMethod[category] || 0) + p.totalAmount
    })
    
    return Object.entries(byMethod).map(([method, amount]) => ({
      method,
      amount,
      percentage: Math.round((amount / total) * 100)
    })).sort((a, b) => b.amount - a.amount)
  }, [payments])

  // Filtered payments
  const filteredPayments = useMemo(() => {
    let result = [...payments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    if (tab === 'pending') result = result.filter(p => p.status === 'pending')
    if (tab === 'refunds') result = result.filter(p => p.status === 'refunded')
    
    if (methodFilter !== 'all') {
      result = result.filter(p => p.method === methodFilter)
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.customerName.toLowerCase().includes(q) ||
        (p.ticketNumber || '').toLowerCase().includes(q) ||
        (p.invoiceNumber || '').toLowerCase().includes(q)
      )
    }
    
    return result
  }, [payments, tab, methodFilter, searchQuery])

  const weeklyRevenue = useMemo(() => {
    const days: { day: string; dateKey: string; amount: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = d.toLocaleString('en-US', { weekday: 'short' })
      days.push({ day: label, dateKey: key, amount: 0 })
    }
    const lookup = new Map(days.map((d) => [d.dateKey, d]))
    payments.forEach((p) => {
      const key = new Date(p.createdAt).toISOString().slice(0, 10)
      const entry = lookup.get(key)
      if (entry) entry.amount += Number(p.totalAmount || 0)
    })
    return days
  }, [payments])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="Loading..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[400px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Payment collection, transaction history, and cash management."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => {
                try {
                  const blob = new Blob([JSON.stringify(payments, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `payments-${Date.now()}.json`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                  toast.success('Exported payments JSON')
                } catch {
                  toast.error('Failed to export')
                }
              }}
            >
              Export
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setRecordOpen(true)}>
              Record Payment
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 rounded-2xl border border-emerald-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{fmtMoney(stats.collectedToday)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Today</div>
            <div className="text-xs text-emerald-400 mt-1">{stats.transactionsToday} transactions</div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-blue-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{fmtMoney(stats.collectedWeek)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">This Week</div>
            <div className="text-xs text-blue-400 mt-1">Last 7 days</div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-amber-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            {stats.outstanding > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <AlertCircle className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{fmtMoney(stats.outstanding)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Outstanding</div>
            <div className="text-xs text-amber-400 mt-1">Pending invoices</div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-purple-500/20 transition-all hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{payments.length}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Total Transactions</div>
            <div className="text-xs text-purple-400 mt-1">All time</div>
          </div>
        </GlassCard>
      </div>

      {/* Payment Breakdown Today */}
      <GlassCard className="rounded-2xl p-4">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Payment Breakdown (All Time)</div>
        <div className="grid gap-2 md:grid-cols-3">
          {methodBreakdown.map((m) => (
            <div key={m.method} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                    {m.method === 'Cash' && <Banknote className="w-4 h-4 text-emerald-400" />}
                    {m.method === 'Card' && <CreditCard className="w-4 h-4 text-purple-400" />}
                    {m.method === 'Digital' && <Smartphone className="w-4 h-4 text-blue-400" />}
                    {m.method}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{fmtMoney(m.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      m.method === 'Cash' && 'bg-emerald-500',
                      m.method === 'Card' && 'bg-purple-500',
                      m.method === 'Digital' && 'bg-blue-500'
                    )}
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{m.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Payments Table */}
        <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-[var(--border-default)]">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as 'all' | 'pending' | 'refunds')}
              tabs={[
                { value: 'all', label: 'All Payments' },
                { value: 'pending', label: 'Pending' },
                { value: 'refunds', label: 'Refunds' },
              ]}
            />
          </div>

          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Search customer or ticket…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cash-app">Cash App</option>
                <option value="venmo">Venmo</option>
                <option value="zelle">Zelle</option>
                <option value="apple-pay">Apple Pay</option>
              </select>
              <button className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <Calendar className="w-4 h-4" /> Date
              </button>
              <button className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <User className="w-4 h-4" /> Staff
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<FileText className="w-8 h-8" aria-hidden="true" />}
                title="No payments found"
                description="Adjust your filters or record a new payment."
                cta={
                  <button className="btn-primary px-5 py-3 rounded-xl" onClick={() => setRecordOpen(true)}>
                    Record Payment
                  </button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)] border-b border-white/[0.06]">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const status = statusConfig[p.status]
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedPayment(p)}
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm text-[var(--text-primary)]">{fmtDate(p.createdAt)}</div>
                          <div className="text-xs text-[var(--text-muted)]">{fmtTime(p.createdAt)}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-[var(--text-primary)]">{p.customerName}</div>
                          {p.invoiceNumber && (
                            <div className="text-xs text-[var(--text-muted)]">{p.invoiceNumber}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.ticketNumber ? (
                            <span className="text-sm font-medium text-purple-300">{p.ticketNumber}</span>
                          ) : (
                            <span className="text-sm text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{methodIcons[p.method]}</span>
                            <span className="text-sm text-[var(--text-secondary)]">{methodLabels[p.method]}</span>
                          </div>
                          {p.tip && p.tip > 0 && (
                            <div className="text-xs text-emerald-400">+{fmtMoney(p.tip)} tip</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{fmtMoney(p.totalAmount)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-[var(--text-muted)]">{p.collectedByName}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Revenue Chart */}
          <GlassCard className="rounded-3xl p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Weekly Revenue</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Last 7 days</div>
            </div>
            <div className="h-[180px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyRevenue} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34,197,94,0.4)" />
                      <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                      color: 'white',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="rgba(34,197,94,0.9)" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick Actions</div>
            <div className="space-y-2">
              <button 
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors flex items-center gap-3"
                onClick={() => setRecordOpen(true)}
              >
                <Plus className="w-4 h-4 text-purple-400" />
                Record Payment
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Process Refund
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors flex items-center gap-3">
                <Wallet className="w-4 h-4 text-purple-400" />
                Cash Drawer
              </button>
              <button className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors flex items-center gap-3">
                <Download className="w-4 h-4 text-purple-400" />
                Export Transactions
              </button>
            </div>
          </GlassCard>

          {/* Cash Drawer Status */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Cash Drawer</div>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-medium border border-emerald-500/20">
                Open
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Opening Balance</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">$200.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Cash In</span>
                <span className="text-sm font-medium text-emerald-400">+$582.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Cash Out</span>
                <span className="text-sm font-medium text-red-400">-$50.00</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Expected</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">$732.00</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-colors">
              Close & Reconcile
            </button>
          </GlassCard>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={recordOpen}
        onOpenChange={setRecordOpen}
        title="Record Payment"
        description="Manually record a payment"
      >
        <RecordPaymentForm onClose={() => setRecordOpen(false)} onRecorded={refreshPayments} />
      </Modal>

      {/* Payment Details Drawer */}
      <Drawer
        open={!!selectedPayment}
        onOpenChange={(o) => !o && setSelectedPayment(null)}
        title={`Payment Details`}
        description={selectedPayment ? `${fmtDate(selectedPayment.createdAt)} at ${fmtTime(selectedPayment.createdAt)}` : undefined}
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="rounded-2xl p-4">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Amount</div>
                <div className="text-xl font-bold text-[var(--text-primary)] mt-1">{fmtMoney(selectedPayment.amount)}</div>
                {selectedPayment.tip && selectedPayment.tip > 0 && (
                  <div className="text-sm text-emerald-400 mt-1">+{fmtMoney(selectedPayment.tip)} tip</div>
                )}
              </GlassCard>
              <GlassCard className="rounded-2xl p-4">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Status</div>
                <div className={cn('text-sm font-semibold mt-2 px-3 py-1 rounded-full inline-block', statusConfig[selectedPayment.status].color)}>
                  {statusConfig[selectedPayment.status].label}
                </div>
              </GlassCard>
            </div>

            <GlassCard className="rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Customer</span>
                <span className="text-sm text-[var(--text-primary)]">{selectedPayment.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Method</span>
                <span className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                  {methodIcons[selectedPayment.method]} {methodLabels[selectedPayment.method]}
                </span>
              </div>
              {selectedPayment.ticketNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Ticket</span>
                  <span className="text-sm text-purple-300">{selectedPayment.ticketNumber}</span>
                </div>
              )}
              {selectedPayment.invoiceNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Invoice</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedPayment.invoiceNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Processed by</span>
                <span className="text-sm text-[var(--text-primary)]">{selectedPayment.collectedByName}</span>
              </div>
              {selectedPayment.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Reference</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{selectedPayment.reference}</span>
                </div>
              )}
              {selectedPayment.processorFee && selectedPayment.processorFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Processing Fee</span>
                  <span className="text-sm text-red-400">-{fmtMoney(selectedPayment.processorFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Net Amount</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{fmtMoney(selectedPayment.netAmount)}</span>
              </div>
            </GlassCard>

            <div className="flex items-center gap-2 pt-2">
              <button className="btn-secondary px-4 py-3 rounded-xl flex-1 flex items-center justify-center gap-2">
                <Receipt className="w-4 h-4" />
                Print Receipt
              </button>
              {selectedPayment.status === 'completed' && (
                <button
                  className="btn-secondary px-4 py-3 rounded-xl flex-1 flex items-center justify-center gap-2 text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/payments/${selectedPayment.id}/refund`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: 'Manual refund' }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to refund')
                      }
                      toast.success('Refund processed')
                      setSelectedPayment(null)
                      await refreshPayments()
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to refund')
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refund
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

// Record Payment Form
function RecordPaymentForm({ onClose, onRecorded }: { onClose: () => void; onRecorded: () => void }) {
  const [invoiceOrTicket, setInvoiceOrTicket] = useState('')
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [tip, setTip] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [saving, setSaving] = useState(false)

  const total = (parseFloat(amount) || 0) + (parseFloat(tip) || 0)

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Invoice or Ticket # (optional)</label>
        <input
          className="input bg-white/[0.04] border-white/10"
          placeholder="INV-0001 or FIX-0001"
          value={invoiceOrTicket}
          onChange={(e) => setInvoiceOrTicket(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Customer Name</label>
        <input className="input bg-white/[0.04] border-white/10" placeholder="Walk-in Customer" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount</label>
          <input 
            className="input bg-white/[0.04] border-white/10" 
            placeholder="$0.00" 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tip (optional)</label>
          <input 
            className="input bg-white/[0.04] border-white/10" 
            placeholder="$0.00" 
            type="number"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <label className="label">Payment Method</label>
        <div className="grid grid-cols-5 gap-2">
          {(['cash', 'card', 'cash-app', 'venmo', 'zelle'] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'p-3 rounded-xl border text-center transition-all',
                method === m 
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                  : 'bg-white/[0.04] border-white/10 text-[var(--text-muted)] hover:bg-white/[0.08]'
              )}
            >
              <div className="text-lg">{methodIcons[m]}</div>
              <div className="text-xs mt-1">{methodLabels[m]}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Reference # (optional)</label>
        <input
          className="input bg-white/[0.04] border-white/10"
          placeholder="Transaction ID, check number..."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>

      {total > 0 && (
        <GlassCard className="rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Amount</span>
            <span className="text-sm text-[var(--text-primary)]">{fmtMoney(parseFloat(amount) || 0)}</span>
          </div>
          {parseFloat(tip) > 0 && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-[var(--text-muted)]">Tip</span>
              <span className="text-sm text-emerald-400">+{fmtMoney(parseFloat(tip))}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Total</span>
            <span className="text-lg font-bold text-[var(--text-primary)]">{fmtMoney(total)}</span>
          </div>
        </GlassCard>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-primary px-4 py-3 rounded-xl flex-1"
          disabled={saving}
          onClick={async () => {
            if (saving) return
            if (!invoiceOrTicket.trim()) return toast.error('Enter an invoice or ticket number')
            if (!Number.isFinite(total) || total <= 0) return toast.error('Enter an amount')

            setSaving(true)
            try {
              const lookup = await fetch(`/api/invoices/lookup?q=${encodeURIComponent(invoiceOrTicket.trim())}`, { cache: 'no-store' })
              if (!lookup.ok) {
                const err = await lookup.json().catch(() => ({}))
                throw new Error(err?.error || 'Invoice not found')
              }
              const found = await lookup.json()
              const invoiceId = found?.id
              if (!invoiceId) throw new Error('Invoice not found')

              const dbMethod =
                method === 'cash'
                  ? 'CASH'
                  : method === 'check'
                    ? 'CHECK'
                    : method === 'card' || method === 'apple-pay' || method === 'google-pay'
                      ? 'CARD'
                      : 'OTHER'

              const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amount: total,
                  method: dbMethod,
                  reference: reference || undefined,
                  notes: parseFloat(tip) > 0 ? `Tip: ${parseFloat(tip)}` : undefined,
                }),
              })

              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to record payment')
              }

              toast.success('Payment recorded')
              await onRecorded()
              onClose()
            } catch (e: any) {
              toast.error(e?.message || 'Failed to record payment')
            } finally {
              setSaving(false)
            }
          }}
        >
          ✓ Complete Payment
        </button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Estimate, EstimateStatus, EstimateItem } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  RotateCcw,
  Trash2,
  Copy,
  Smartphone,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  Percent,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Expired ${Math.abs(diff)}d ago`
  if (diff === 0) return 'Expires today'
  return `${diff}d left`
}

const statusConfig: Record<EstimateStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  draft: { label: 'Draft', color: 'bg-white/10 text-white/60 border-white/20', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Eye },
  approved: { label: 'Approved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
  converted: { label: 'Converted', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: ArrowRight },
}

// Quick Templates
const quickTemplates = [
  { name: 'iPhone Screen', device: 'iPhone 14 Pro', items: [{ type: 'part', desc: 'iPhone 14 Pro Screen (OEM)', price: 180 }, { type: 'labor', desc: 'Screen Installation', price: 39 }] },
  { name: 'Battery Replacement', device: 'Various', items: [{ type: 'part', desc: 'Battery', price: 50 }, { type: 'labor', desc: 'Battery Replacement', price: 39 }] },
  { name: 'Charging Port', device: 'Various', items: [{ type: 'part', desc: 'Charging Port Assembly', price: 80 }, { type: 'labor', desc: 'Port Replacement', price: 49 }] },
  { name: 'Water Damage', device: 'Various', items: [{ type: 'labor', desc: 'Water Damage Diagnostic', price: 49 }] },
]

export function EstimatesPage() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | 'all'>('all')
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([])
  const [builderPreset, setBuilderPreset] = useState<null | {
    deviceType?: string
    deviceModel?: string
    items?: Array<{ type: 'labor' | 'part' | 'accessory' | 'other'; desc: string; price: number }>
  }>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [estRes, custRes] = await Promise.all([
          fetch('/api/estimates', { cache: 'no-store' }),
          fetch('/api/customers', { cache: 'no-store' }),
        ])

        if (!estRes.ok) {
          const err = await estRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load estimates')
        }
        if (!custRes.ok) {
          const err = await custRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load customers')
        }

        const estData = await estRes.json()
        const custData = await custRes.json()

        if (!cancelled) {
          setEstimates(Array.isArray(estData?.estimates) ? estData.estimates : [])
          const list = Array.isArray(custData?.customers) ? custData.customers : []
          setCustomers(
            list.map((c: any) => ({
              id: c.id,
              name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Customer',
              phone: c.phone || '',
            }))
          )
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load estimates')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setTimeout(() => setAnimationReady(true), 100)
        }
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
    const thisMonth = estimates.filter((e) => {
      const d = new Date(e.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    
    const approved = thisMonth.filter((e) => e.status === 'approved' || e.status === 'converted').length
    const totalSent = thisMonth.filter((e) => e.status !== 'draft').length
    const approvalRate = totalSent > 0 ? Math.round((approved / totalSent) * 100) : 0
    
    const quotedTotal = thisMonth.reduce((sum, e) => sum + e.total, 0)
    const pending = estimates.filter((e) => e.status === 'sent' || e.status === 'viewed').length
    
    return { 
      estimatesThisMonth: thisMonth.length, 
      approvalRate, 
      quotedTotal, 
      pending 
    }
  }, [estimates])

  // Filtered estimates
  const filtered = useMemo(() => {
    let result = estimates

    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((e) =>
        `${e.estimateNumber} ${e.customerName} ${e.deviceModel}`.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [estimates, query, statusFilter])

  const openEstimate = (est: Estimate) => {
    setSelectedEstimate(est)
    setDrawerOpen(true)
  }

  const upsertEstimate = (est: Estimate) => {
    setEstimates((prev) => {
      const idx = prev.findIndex((e) => e.id === est.id)
      if (idx === -1) return [est, ...prev]
      const next = [...prev]
      next[idx] = est
      return next
    })
  }

  const patchEstimate = async (id: string, patch: Partial<Estimate>) => {
    const res = await fetch(`/api/estimates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || 'Failed to update estimate')
    }
    const data = await res.json()
    return data?.estimate as Estimate
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Estimates" description="Loading..." />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[100px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Estimates"
          description="Generate repair quotes for customer approval before work begins."
          action={
            <button
              onClick={() => {
                setBuilderPreset(null)
                setBuilderOpen(true)
              }}
              className={cn(
                "group relative px-5 py-3 rounded-xl inline-flex items-center gap-2",
                "text-sm font-semibold text-white",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              )}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Create Estimate
            </button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4 md:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {[
          { label: 'Estimates', value: stats.estimatesThisMonth, sub: 'this month', icon: FileText, gradient: ['#8b5cf6', '#a855f7'] },
          { label: 'Approval Rate', value: `${stats.approvalRate}%`, sub: 'this month', icon: Percent, gradient: ['#10b981', '#059669'] },
          { label: 'Quoted', value: fmtMoney(stats.quotedTotal), sub: 'this month', icon: TrendingUp, gradient: ['#3b82f6', '#2563eb'] },
          { label: 'Pending', value: stats.pending, sub: 'awaiting approval', icon: Clock, gradient: ['#f59e0b', '#d97706'] },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative rounded-xl p-5 overflow-hidden cursor-pointer",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1"
              )}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className="w-6 h-6 transition-colors"
                  style={{ color: `${stat.gradient[0]}80` }}
                />
              </div>
              <div className="text-xs text-white/50 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/40 mt-1">{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Quick Templates */}
      <div className={cn(
        "flex items-center gap-3 overflow-x-auto pb-2 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '150ms' }}>
        <span className="text-xs text-white/40 whitespace-nowrap">Quick:</span>
        {quickTemplates.map((tpl, i) => (
          <button
            key={tpl.name}
            onClick={() => {
              setBuilderPreset({
                deviceType: tpl.device.split(' ')[0] || 'Device',
                deviceModel: tpl.device,
                items: tpl.items.map((it) => ({
                  type: it.type as any,
                  desc: it.desc,
                  price: it.price,
                })),
              })
              setBuilderOpen(true)
            }}
            className="px-3 py-2 rounded-xl text-sm text-white/70 whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={cn(
        "flex items-center gap-3 flex-wrap transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        <div className="relative flex-1 max-w-[320px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-2.5 rounded-xl",
              "bg-white/[0.03] border border-white/[0.08]",
              "text-sm text-white placeholder:text-white/40",
              "outline-none transition-all duration-300",
              "focus:border-purple-500/50 focus:bg-white/[0.05]",
              "focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
            )}
            placeholder="Search estimate #, customer..."
          />
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Filter className="w-4 h-4 text-white/40" />
          <select
            className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EstimateStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No estimates found"
            description="Create your first estimate to start quoting repairs."
            cta={
              <button
                className="btn-primary px-5 py-3 rounded-xl inline-flex items-center gap-2"
                onClick={() => setBuilderOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create Estimate
              </button>
            }
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden rounded-3xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--text-primary)]/85">
              {filtered.length} estimate{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-faint)] border-b border-white/10">
                  <th className="px-5 py-3">Estimate</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Valid Until</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((est) => {
                  const status = statusConfig[est.status]
                  const StatusIcon = status.icon
                  const isExpired = new Date(est.validUntil) < new Date() && est.status !== 'approved' && est.status !== 'converted'
                  return (
                    <tr
                      key={est.id}
                      className="border-b border-white/10 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => openEstimate(est)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--text-primary)]">{est.estimateNumber}</div>
                        <div className="text-xs text-[var(--text-muted)]">{fmtDate(est.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-[var(--text-primary)]/80">{est.customerName}</div>
                        <div className="text-xs text-[var(--text-muted)]">{est.customerPhone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[var(--text-muted)]" />
                          <div>
                            <div className="text-sm text-[var(--text-primary)]/80">{est.deviceType} {est.deviceModel}</div>
                            {est.deviceCondition && (
                              <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{est.deviceCondition}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--text-primary)]">{fmtMoney(est.total)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border",
                          status.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                        {est.status === 'declined' && est.declineReason && (
                          <div className="text-xs text-red-400 mt-1 truncate max-w-[100px]">"{est.declineReason}"</div>
                        )}
                        {est.convertedToTicketId && (
                          <div className="text-xs text-teal-400 mt-1">→ Ticket</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className={cn(
                          "text-sm font-medium",
                          isExpired ? "text-red-400" : "text-[var(--text-primary)]/75"
                        )}>
                          {fmtDate(est.validUntil)}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isExpired ? "text-red-400" : "text-[var(--text-muted)]"
                        )}>
                          {daysUntil(est.validUntil)}
                        </div>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {est.status === 'draft' && (
                            <button
                              className="btn-primary px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1"
                              onClick={async () => {
                                try {
                                  const next = await patchEstimate(est.id, { status: 'sent' as any })
                                  upsertEstimate(next)
                                  toast.success('Estimate sent')
                                } catch (e: any) {
                                  toast.error(e?.message || 'Failed to send')
                                }
                              }}
                            >
                              <Send className="w-3 h-3" /> Send
                            </button>
                          )}
                          {(est.status === 'approved') && !est.convertedToTicketId && (
                            <button
                              className="btn-primary px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/estimates/${est.id}/convert`, { method: 'POST' })
                                  if (!res.ok) {
                                    const err = await res.json().catch(() => ({}))
                                    throw new Error(err?.error || 'Failed to convert')
                                  }
                                  const data = await res.json()
                                  if (data?.estimate) upsertEstimate(data.estimate)
                                  toast.success(`Converted to ticket ${data?.ticketNumber || ''}`.trim())
                                } catch (e: any) {
                                  toast.error(e?.message || 'Failed to convert')
                                }
                              }}
                            >
                              <ArrowRight className="w-3 h-3" /> Convert
                            </button>
                          )}
                          {(est.status === 'sent' || est.status === 'viewed') && (
                            <button
                              className="btn-secondary px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1"
                              onClick={async () => {
                                try {
                                  const next = await patchEstimate(est.id, { status: 'sent' as any })
                                  upsertEstimate(next)
                                  toast.success('Estimate resent')
                                } catch (e: any) {
                                  toast.error(e?.message || 'Failed to resend')
                                }
                              }}
                            >
                              <RotateCcw className="w-3 h-3" /> Resend
                            </button>
                          )}
                          <button className="btn-secondary p-2 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Estimate Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedEstimate?.estimateNumber || 'Estimate'}
        description={selectedEstimate ? `${selectedEstimate.customerName}` : undefined}
        className="max-w-[600px]"
      >
        {selectedEstimate && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between gap-4">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border",
                statusConfig[selectedEstimate.status].color
              )}>
                {statusConfig[selectedEstimate.status].label}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/estimates/${selectedEstimate.id}/duplicate`, { method: 'POST' })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to duplicate')
                      }
                      const data = await res.json()
                      if (data?.estimate) upsertEstimate(data.estimate)
                      toast.success('Duplicated to draft')
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to duplicate')
                    }
                  }}
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
              </div>
            </div>

            {/* Device Info */}
            <GlassCard className="rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/15">
                  <Smartphone className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {selectedEstimate.deviceType} {selectedEstimate.deviceModel}
                  </div>
                  {selectedEstimate.deviceCondition && (
                    <div className="text-sm text-[var(--text-muted)]">{selectedEstimate.deviceCondition}</div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Customer Info */}
            <GlassCard className="rounded-2xl p-4">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Customer</div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{selectedEstimate.customerName}</div>
              <div className="text-sm text-[var(--text-muted)]">{selectedEstimate.customerPhone}</div>
              {selectedEstimate.customerEmail && (
                <div className="text-sm text-[var(--text-muted)]">{selectedEstimate.customerEmail}</div>
              )}
            </GlassCard>

            {/* Line Items */}
            <GlassCard className="rounded-2xl p-4">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Line Items</div>
              <div className="space-y-2">
                {selectedEstimate.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm text-[var(--text-primary)]">{item.description}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {item.type} • {item.quantity} × {fmtMoney(item.unitPrice)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{fmtMoney(item.total)}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Totals */}
            <GlassCard className="rounded-2xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Subtotal</span>
                  <span className="text-[var(--text-primary)]">{fmtMoney(selectedEstimate.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Tax ({(selectedEstimate.taxRate * 100).toFixed(2)}%)</span>
                  <span className="text-[var(--text-primary)]">{fmtMoney(selectedEstimate.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span className="text-[var(--text-primary)]">{fmtMoney(selectedEstimate.total)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Validity */}
            <GlassCard className="rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Valid Until</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">{fmtDate(selectedEstimate.validUntil)}</div>
                </div>
                <div className={cn(
                  "text-sm font-medium px-3 py-1 rounded-lg",
                  new Date(selectedEstimate.validUntil) < new Date()
                    ? "bg-red-500/15 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300"
                )}>
                  {daysUntil(selectedEstimate.validUntil)}
                </div>
              </div>
            </GlassCard>

            {/* Notes */}
            {selectedEstimate.notes && (
              <GlassCard className="rounded-2xl p-4">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Notes</div>
                <div className="text-sm text-[var(--text-secondary)]">{selectedEstimate.notes}</div>
              </GlassCard>
            )}

            {/* Decline Reason */}
            {selectedEstimate.status === 'declined' && selectedEstimate.declineReason && (
              <GlassCard className="rounded-2xl p-4 border-red-500/30">
                <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Decline Reason</div>
                <div className="text-sm text-red-300">"{selectedEstimate.declineReason}"</div>
              </GlassCard>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
              {selectedEstimate.status === 'draft' && (
                <button
                  className="btn-primary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1"
                  onClick={async () => {
                    try {
                      const next = await patchEstimate(selectedEstimate.id, { status: 'sent' as any })
                      setSelectedEstimate(next)
                      upsertEstimate(next)
                      toast.success('Estimate sent')
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to send')
                    }
                  }}
                >
                  <Send className="w-4 h-4" />
                  Send Estimate
                </button>
              )}
              {selectedEstimate.status === 'approved' && !selectedEstimate.convertedToTicketId && (
                <button
                  className="btn-primary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/estimates/${selectedEstimate.id}/convert`, { method: 'POST' })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to convert')
                      }
                      const data = await res.json()
                      if (data?.estimate) {
                        setSelectedEstimate(data.estimate)
                        upsertEstimate(data.estimate)
                      }
                      toast.success(`Converted to ticket ${data?.ticketNumber || ''}`.trim())
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to convert')
                    }
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                  Convert to Ticket
                </button>
              )}
              {(selectedEstimate.status === 'sent' || selectedEstimate.status === 'viewed') && (
                <>
                  <button
                    className="btn-secondary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1"
                    onClick={async () => {
                      try {
                        const next = await patchEstimate(selectedEstimate.id, { status: 'sent' as any })
                        setSelectedEstimate(next)
                        upsertEstimate(next)
                        toast.success('Estimate resent')
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to resend')
                      }
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Resend
                  </button>
                  <button
                    className="btn-secondary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1"
                    onClick={async () => {
                      try {
                        const nextUntil = new Date(new Date(selectedEstimate.validUntil).getTime() + 7 * 86400000).toISOString()
                        const next = await patchEstimate(selectedEstimate.id, { validUntil: nextUntil } as any)
                        setSelectedEstimate(next)
                        upsertEstimate(next)
                        toast.success('Extended by 7 days')
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to extend')
                      }
                    }}
                  >
                    <Calendar className="w-4 h-4" />
                    Extend
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Estimate Builder Drawer */}
      <Drawer
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        title="Create Estimate"
        description="Generate a quote for customer approval"
        className="max-w-[700px]"
      >
        <EstimateBuilder
          customers={customers}
          preset={builderPreset}
          onClose={() => setBuilderOpen(false)}
          onCreated={(est) => {
            upsertEstimate(est)
            toast.success(`Estimate created (${est.estimateNumber})`)
          }}
        />
      </Drawer>
    </div>
  )
}

// Estimate Builder Component
function EstimateBuilder({
  onClose,
  customers,
  preset,
  onCreated,
}: {
  onClose: () => void
  customers: Array<{ id: string; name: string; phone: string }>
  preset: null | {
    deviceType?: string
    deviceModel?: string
    items?: Array<{ type: 'labor' | 'part' | 'accessory' | 'other'; desc: string; price: number }>
  }
  onCreated: (est: Estimate) => void
}) {
  const [customer, setCustomer] = useState('')
  const [deviceType, setDeviceType] = useState(preset?.deviceType || '')
  const [deviceModel, setDeviceModel] = useState(preset?.deviceModel || '')
  const [deviceCondition, setDeviceCondition] = useState('')
  const [items, setItems] = useState<{ type: string; description: string; qty: number; price: number }[]>([
    ...(preset?.items?.length
      ? preset.items.map((it) => ({ type: it.type, description: it.desc, qty: 1, price: it.price }))
      : [{ type: 'part', description: '', qty: 1, price: 0 }]),
  ])
  const [taxRate] = useState(0.0825)
  const [notes, setNotes] = useState('')
  const [validDays, setValidDays] = useState('7')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!preset) return
    setDeviceType(preset.deviceType || '')
    setDeviceModel(preset.deviceModel || '')
    if (preset.items?.length) {
      setItems(preset.items.map((it) => ({ type: it.type, description: it.desc, qty: 1, price: it.price })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.deviceType, preset?.deviceModel])

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100
  const total = subtotal + taxAmount

  const addItem = () => {
    setItems([...items, { type: 'labor', description: '', qty: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Customer</label>
        <select
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="input bg-white/[0.04] border-white/10 w-full"
        >
          <option value="">Select customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} • {c.phone}</option>
          ))}
        </select>
      </div>

      {/* Device Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Device Type</label>
          <input
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            placeholder="iPhone, Samsung, iPad..."
            className="input bg-white/[0.04] border-white/10 w-full"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Model</label>
          <input
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder="14 Pro, S23 Ultra..."
            className="input bg-white/[0.04] border-white/10 w-full"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Condition</label>
        <input
          value={deviceCondition}
          onChange={(e) => setDeviceCondition(e.target.value)}
          placeholder="Cracked screen, battery draining..."
          className="input bg-white/[0.04] border-white/10 w-full"
        />
      </div>

      {/* Line Items */}
      <GlassCard className="rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Line Items</div>
          <button onClick={addItem} className="btn-secondary px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[80px_1fr_60px_80px_40px] gap-2 items-center">
              <select
                value={item.type}
                onChange={(e) => updateItem(index, 'type', e.target.value)}
                className="input bg-white/[0.04] border-white/10 text-xs py-2"
              >
                <option value="part">Part</option>
                <option value="labor">Labor</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
              <input
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Description"
                className="input bg-white/[0.04] border-white/10 text-sm py-2"
              />
              <input
                type="number"
                value={item.qty}
                onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                className="input bg-white/[0.04] border-white/10 text-sm py-2 text-center"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                placeholder="$0.00"
                className="input bg-white/[0.04] border-white/10 text-sm py-2"
              />
              {items.length > 1 && (
                <button onClick={() => removeItem(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Totals */}
      <GlassCard className="rounded-2xl p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span className="text-[var(--text-primary)]">{fmtMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Tax (8.25%)</span>
            <span className="text-[var(--text-primary)]">{fmtMoney(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
            <span className="text-[var(--text-primary)]">Total</span>
            <span className="text-[var(--text-primary)]">{fmtMoney(total)}</span>
          </div>
        </div>
      </GlassCard>

      {/* Validity */}
      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Valid For</label>
        <select
          value={validDays}
          onChange={(e) => setValidDays(e.target.value)}
          className="input bg-white/[0.04] border-white/10 w-full"
        >
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Notes to Customer</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-[var(--text-primary)] placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 min-h-[80px]"
          placeholder="Any notes for the customer..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
        <button onClick={onClose} className="btn-secondary px-4 py-3 rounded-xl text-sm flex-1">
          Cancel
        </button>
        <button
          className="btn-secondary px-4 py-3 rounded-xl text-sm flex-1 inline-flex items-center justify-center gap-2"
          disabled={saving}
          onClick={async () => {
            if (saving) return
            if (!customer) return toast.error('Select a customer')
            if (!deviceType.trim()) return toast.error('Device type is required')
            if (items.every((i) => !i.description.trim())) return toast.error('Add at least one line item description')
            setSaving(true)
            try {
              const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: customer,
                  deviceType,
                  deviceModel,
                  deviceCondition,
                  taxRate,
                  validUntil: new Date(Date.now() + Number(validDays) * 86400000).toISOString(),
                  notes,
                  status: 'draft',
                  items: items.map((i) => ({
                    type: i.type,
                    description: i.description,
                    quantity: i.qty,
                    unitPrice: i.price,
                  })),
                }),
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to save draft')
              }
              const data = await res.json()
              if (data?.estimate) onCreated(data.estimate)
              onClose()
            } catch (e: any) {
              toast.error(e?.message || 'Failed to save draft')
            } finally {
              setSaving(false)
            }
          }}
        >
          <FileText className="w-4 h-4" /> Save Draft
        </button>
        <button
          className="btn-primary px-4 py-3 rounded-xl text-sm flex-1 inline-flex items-center justify-center gap-2"
          disabled={saving}
          onClick={async () => {
            if (saving) return
            if (!customer) return toast.error('Select a customer')
            if (!deviceType.trim()) return toast.error('Device type is required')
            if (items.every((i) => !i.description.trim())) return toast.error('Add at least one line item description')
            setSaving(true)
            try {
              const res = await fetch('/api/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: customer,
                  deviceType,
                  deviceModel,
                  deviceCondition,
                  taxRate,
                  validUntil: new Date(Date.now() + Number(validDays) * 86400000).toISOString(),
                  notes,
                  status: 'sent',
                  items: items.map((i) => ({
                    type: i.type,
                    description: i.description,
                    quantity: i.qty,
                    unitPrice: i.price,
                  })),
                }),
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to send estimate')
              }
              const data = await res.json()
              if (data?.estimate) onCreated(data.estimate)
              onClose()
            } catch (e: any) {
              toast.error(e?.message || 'Failed to send estimate')
            } finally {
              setSaving(false)
            }
          }}
        >
          <Send className="w-4 h-4" /> Send Estimate
        </button>
      </div>
    </div>
  )
}

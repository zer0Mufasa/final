'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WarrantyClaim, WarrantyClaimStatus, WarrantyInfo } from '@/lib/mock/types'
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
import Link from 'next/link'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Search,
  User,
  Smartphone,
  FileText,
  Plus,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Package,
  Wrench,
  RotateCcw,
  DollarSign,
  Printer,
  MoreHorizontal,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysRemaining(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

const statusConfig: Record<WarrantyClaimStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: CheckCircle2 },
  denied: { label: 'Denied', color: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: ShieldCheck },
}

const coverageTerms = [
  {
    category: 'Covered',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    items: ['Parts defects', 'Labor defects', 'Component failure', 'Installation issues'],
    color: 'emerald',
  },
  {
    category: 'Not Covered',
    icon: <XCircle className="w-4 h-4 text-rose-400" />,
    items: ['Accidental damage', 'Water/liquid damage', 'Unauthorized repairs', 'Physical abuse'],
    color: 'rose',
  },
  {
    category: 'Conditions',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    items: ['Original receipt required', 'No signs of tampering', '90-day standard term', 'One claim per repair'],
    color: 'amber',
  },
]

export function WarrantyClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'claims' | 'lookup'>('claims')
  const [statusFilter, setStatusFilter] = useState<WarrantyClaimStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null)
  const [claimDrawerOpen, setClaimDrawerOpen] = useState(false)
  const [newClaimOpen, setNewClaimOpen] = useState(false)
  const [claims, setClaims] = useState<WarrantyClaim[]>([])
  const [ticketsCount90, setTicketsCount90] = useState(0)
  
  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResult, setLookupResult] = useState<WarrantyInfo | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [newClaimForm, setNewClaimForm] = useState({
    ticketNumber: '',
    claimReason: '',
    claimDescription: '',
    resolutionType: 'Redo Repair (Free)',
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const [claimsRes, ticketsRes] = await Promise.all([
          fetch('/api/warranty/claims', { cache: 'no-store' }),
          fetch('/api/tickets?limit=200', { cache: 'no-store' }),
        ])

        if (!claimsRes.ok) {
          const err = await claimsRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load claims')
        }

        const claimsData = await claimsRes.json()
        const ticketsData = ticketsRes.ok ? await ticketsRes.json().catch(() => ({})) : {}
        const tix = Array.isArray(ticketsData?.tickets) ? ticketsData.tickets : []
        const ninetyAgo = Date.now() - 90 * 86400000
        const active = tix.filter((t: any) => new Date(t.createdAt).getTime() >= ninetyAgo).length

        if (!cancelled) {
          setClaims(Array.isArray(claimsData?.claims) ? claimsData.claims : [])
          setTicketsCount90(active)
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load warranty data')
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
    const pending = claims.filter((c) => c.status === 'pending').length
    const thisMonth = claims.filter((c) => {
      const d = new Date(c.claimDate)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const claimRate = ticketsCount90 > 0 ? Math.round((thisMonth / Math.max(1, ticketsCount90)) * 1000) / 10 : 0
    const activeWarranties = ticketsCount90
    return { pending, thisMonth, claimRate, activeWarranties }
  }, [claims, ticketsCount90])

  // Filtered claims
  const filteredClaims = useMemo(() => {
    let result = claims

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((c) =>
        c.ticketNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.originalRepairType.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime())
  }, [claims, statusFilter, searchQuery])

  const openClaim = (claim: WarrantyClaim) => {
    setSelectedClaim(claim)
    setClaimDrawerOpen(true)
  }

  // Warranty Lookup
  const handleLookup = async () => {
    setLookupError('')
    setLookupResult(null)
    
    if (!lookupQuery.trim()) {
      setLookupError('Please enter a ticket number or phone number')
      return
    }
    try {
      const res = await fetch(`/api/warranty/lookup?q=${encodeURIComponent(lookupQuery.trim())}`, { cache: 'no-store' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'No warranty found')
      }
      const data = await res.json()
      setLookupResult(data)
      setNewClaimForm((p) => ({ ...p, ticketNumber: data.ticketNumber }))
    } catch (e: any) {
      setLookupError(e?.message || 'No warranty found for this ticket or phone number')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Warranty & Returns" description="Loading..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
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
          title="Warranty & Returns"
          description="Manage post-repair warranties and process customer returns."
          action={
            <button
              onClick={() => setNewClaimOpen(true)}
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
              <Plus className="w-4 h-4" />
              New Claim
            </button>
          }
        />
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        <GlassCard className="p-5 rounded-2xl border border-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.pending}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Pending Claims</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.thisMonth}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">This Month</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.claimRate}%</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Claim Rate</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.activeWarranties}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Active Warranties</div>
        </GlassCard>
      </div>

      {/* Tab Selection */}
      <div className={cn(
        "flex items-center gap-2 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        <button
          onClick={() => setActiveTab('claims')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            activeTab === 'claims'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/[0.04] text-[var(--text-muted)] border border-white/10 hover:bg-white/[0.08]'
          )}
        >
          Warranty Claims
        </button>
        <button
          onClick={() => setActiveTab('lookup')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
            activeTab === 'lookup'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/[0.04] text-[var(--text-muted)] border border-white/10 hover:bg-white/[0.08]'
          )}
        >
          Warranty Lookup
        </button>
      </div>

      {activeTab === 'claims' ? (
        <div className={cn(
          "grid gap-4 lg:grid-cols-3 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '300ms' }}>
          {/* Claims List */}
          <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    placeholder="Search ticket, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as WarrantyClaimStatus | 'all')}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Shield className="w-8 h-8" />}
                  title="No claims found"
                  description="Adjust your filters or file a new claim."
                  cta={
                    <button className="btn-primary px-5 py-3 rounded-xl" onClick={() => setNewClaimOpen(true)}>
                      File Claim
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)] border-b border-white/[0.06]">
                      <th className="px-5 py-3">Claim</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Original Repair</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => {
                      const status = statusConfig[claim.status]
                      const StatusIcon = status.icon
                      return (
                        <tr
                          key={claim.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                          onClick={() => openClaim(claim)}
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-purple-300">{claim.ticketNumber}</div>
                            <div className="text-xs text-[var(--text-muted)]">{fmtDate(claim.claimDate)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-[var(--text-primary)]">{claim.customerName}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-[var(--text-primary)]/80">{claim.originalRepairType}</div>
                            <div className="text-xs text-[var(--text-muted)]">{fmtDate(claim.originalRepairDate)}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-[var(--text-primary)]/80 truncate max-w-[150px]">{claim.claimReason}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border",
                              status.color
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Coverage Terms */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Coverage Terms</div>
            </div>
            <div className="space-y-4">
              {coverageTerms.map((term) => (
                <div
                  key={term.category}
                  className={cn(
                    'rounded-2xl p-4 border',
                    term.color === 'emerald' && 'bg-emerald-500/[0.05] border-emerald-500/20',
                    term.color === 'rose' && 'bg-rose-500/[0.05] border-rose-500/20',
                    term.color === 'amber' && 'bg-amber-500/[0.05] border-amber-500/20'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {term.icon}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{term.category}</span>
                  </div>
                  <ul className="space-y-1">
                    {term.items.map((item) => (
                      <li key={item} className="text-xs text-[var(--text-muted)] pl-6">• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : (
        /* Warranty Lookup Tab */
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Lookup Form */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-purple-400" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Warranty Lookup</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Enter Ticket # or Phone
                </label>
                <div className="flex gap-2">
                  <input
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    placeholder="FIX-1041 or (512) 555-0142"
                  />
                  <button onClick={handleLookup} className="btn-primary px-6 py-3 rounded-xl">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
                  <div className="flex items-center gap-2 text-red-300">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">{lookupError}</span>
                  </div>
                </div>
              )}

              {lookupResult && (
                <div className={cn(
                  "rounded-2xl border p-4 space-y-3",
                  lookupResult.isActive 
                    ? "bg-emerald-500/10 border-emerald-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                )}>
                  <div className="flex items-center gap-2">
                    {lookupResult.isActive ? (
                      <>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">WARRANTY ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <ShieldX className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-semibold text-red-300">WARRANTY EXPIRED</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Ticket</span>
                      <span className="text-sm text-purple-300 font-semibold">{lookupResult.ticketNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Customer</span>
                      <span className="text-sm text-[var(--text-primary)]">{lookupResult.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Phone</span>
                      <span className="text-sm text-[var(--text-primary)]">{lookupResult.customerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Repair</span>
                      <span className="text-sm text-[var(--text-primary)]">{lookupResult.repairType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Repair Date</span>
                      <span className="text-sm text-[var(--text-primary)]">{fmtDate(lookupResult.repairDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Warranty</span>
                      <span className="text-sm text-[var(--text-primary)]">{lookupResult.warrantyPeriod} days (Parts & Labor)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Expires</span>
                      <span className="text-sm text-[var(--text-primary)]">{fmtDate(lookupResult.warrantyExpires)}</span>
                    </div>
                    {lookupResult.isActive && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)]">Remaining</span>
                        <span className="text-sm font-semibold text-emerald-400">{lookupResult.daysRemaining} days</span>
                      </div>
                    )}
                  </div>

                  {lookupResult.isActive && (
                    <button
                      onClick={() => setNewClaimOpen(true)}
                      className="w-full mt-4 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      File Warranty Claim
                    </button>
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Warranty Periods */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-400" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Standard Warranty Periods</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-[var(--text-primary)]">Screen Repairs</span>
                </div>
                <span className="text-sm font-semibold text-emerald-400">90 days</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-[var(--text-primary)]">Battery Replacement</span>
                </div>
                <span className="text-sm font-semibold text-amber-400">30 days</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-[var(--text-primary)]">Charging Port</span>
                </div>
                <span className="text-sm font-semibold text-blue-400">60 days</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-[var(--text-primary)]">Water Damage</span>
                </div>
                <span className="text-sm font-semibold text-[var(--text-muted)]">No warranty</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Claim Detail Drawer */}
      <Drawer
        open={claimDrawerOpen}
        onOpenChange={setClaimDrawerOpen}
        title={`Claim: ${selectedClaim?.ticketNumber}`}
        description={selectedClaim ? `Filed ${fmtDate(selectedClaim.claimDate)}` : undefined}
        className="max-w-[600px]"
      >
        {selectedClaim && (
          <div className="space-y-4">
            {/* Status */}
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border",
              statusConfig[selectedClaim.status].color
            )}>
              {statusConfig[selectedClaim.status].label}
            </div>

            {/* Customer & Original Repair */}
            <GlassCard className="rounded-2xl p-4">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Original Repair</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Customer</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedClaim.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Ticket</span>
                  <span className="text-sm text-purple-300">{selectedClaim.ticketNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Repair Type</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedClaim.originalRepairType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Repair Date</span>
                  <span className="text-sm text-[var(--text-primary)]">{fmtDate(selectedClaim.originalRepairDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Technician</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedClaim.originalTechName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Original Amount</span>
                  <span className="text-sm text-[var(--text-primary)]">{fmtMoney(selectedClaim.originalAmount)}</span>
                </div>
              </div>
            </GlassCard>

            {/* Warranty Info */}
            <GlassCard className="rounded-2xl p-4">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Warranty</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Period</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedClaim.warrantyPeriod} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Expires</span>
                  <span className="text-sm text-[var(--text-primary)]">{fmtDate(selectedClaim.warrantyExpires)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Type</span>
                  <span className="text-sm text-[var(--text-primary)] capitalize">{selectedClaim.warrantyType}</span>
                </div>
              </div>
            </GlassCard>

            {/* Claim Details */}
            <GlassCard className="rounded-2xl p-4">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Claim Details</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Reason</span>
                  <span className="text-sm text-[var(--text-primary)]">{selectedClaim.claimReason}</span>
                </div>
                <div>
                  <span className="text-sm text-[var(--text-muted)]">Description</span>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{selectedClaim.claimDescription}</p>
                </div>
              </div>
            </GlassCard>

            {/* Resolution (if exists) */}
            {selectedClaim.resolution && (
              <GlassCard className="rounded-2xl p-4 border-blue-500/30">
                <div className="text-xs text-blue-400 uppercase tracking-wider mb-3">Resolution</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">Type</span>
                    <span className="text-sm text-[var(--text-primary)] capitalize">{selectedClaim.resolutionType}</span>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--text-muted)]">Details</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{selectedClaim.resolution}</p>
                  </div>
                  {selectedClaim.reviewedBy && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm text-[var(--text-muted)]">Reviewed by</span>
                      <span className="text-sm text-[var(--text-primary)]">{selectedClaim.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Review Notes (if denied) */}
            {selectedClaim.status === 'denied' && selectedClaim.reviewNotes && (
              <GlassCard className="rounded-2xl p-4 border-red-500/30">
                <div className="text-xs text-red-400 uppercase tracking-wider mb-2">Denial Reason</div>
                <p className="text-sm text-[var(--text-primary)]">{selectedClaim.reviewNotes}</p>
              </GlassCard>
            )}

            {/* Actions */}
            {selectedClaim.status === 'pending' && (
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  className="btn-primary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/warranty/claims/${selectedClaim.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'approved' }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to approve')
                      }
                      const data = await res.json()
                      const next = data?.claim
                      if (next) {
                        setSelectedClaim(next)
                        setClaims((prev) => prev.map((c) => (c.id === next.id ? next : c)))
                      }
                      toast.success('Claim approved')
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to approve claim')
                    }
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Claim
                </button>
                <button
                  className="btn-secondary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1 text-red-300 border-red-500/30"
                  onClick={async () => {
                    const note = window.prompt('Denial reason:', 'Out of warranty / physical damage / liquid damage')
                    if (!note) return
                    try {
                      const res = await fetch(`/api/warranty/claims/${selectedClaim.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'denied', reviewNotes: note }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to deny')
                      }
                      const data = await res.json()
                      const next = data?.claim
                      if (next) {
                        setSelectedClaim(next)
                        setClaims((prev) => prev.map((c) => (c.id === next.id ? next : c)))
                      }
                      toast.success('Claim denied')
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to deny claim')
                    }
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  Deny Claim
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* New Claim Modal */}
      <Modal
        open={newClaimOpen}
        onOpenChange={setNewClaimOpen}
        title="File Warranty Claim"
        description="Submit a warranty claim for a previous repair"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Original Ticket #</label>
            <input
              className="input bg-white/[0.04] border-white/10"
              placeholder="FIX-XXXX"
              value={newClaimForm.ticketNumber}
              onChange={(e) => setNewClaimForm((p) => ({ ...p, ticketNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Claim Reason</label>
            <input
              className="input bg-white/[0.04] border-white/10"
              placeholder="e.g., Screen lifting, Battery draining"
              value={newClaimForm.claimReason}
              onChange={(e) => setNewClaimForm((p) => ({ ...p, claimReason: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea 
              className="input bg-white/[0.04] border-white/10 min-h-[100px]"
              placeholder="Describe the issue in detail..." 
              value={newClaimForm.claimDescription}
              onChange={(e) => setNewClaimForm((p) => ({ ...p, claimDescription: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Proposed Resolution</label>
            <select
              className="select bg-white/[0.04] border-white/10"
              value={newClaimForm.resolutionType}
              onChange={(e) => setNewClaimForm((p) => ({ ...p, resolutionType: e.target.value }))}
            >
              <option>Redo Repair (Free)</option>
              <option>Replace Part</option>
              <option>Full Refund</option>
              <option>Partial Refund</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={() => setNewClaimOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary px-4 py-3 rounded-xl flex-1"
              onClick={async () => {
                try {
                  const res = await fetch('/api/warranty/claims', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ticketNumber: newClaimForm.ticketNumber,
                      claimReason: newClaimForm.claimReason,
                      claimDescription: newClaimForm.claimDescription,
                      resolutionType:
                        newClaimForm.resolutionType.includes('Refund')
                          ? newClaimForm.resolutionType.includes('Partial')
                            ? 'partial-refund'
                            : 'refund'
                          : newClaimForm.resolutionType.includes('Replace')
                            ? 'replacement'
                            : 'redo',
                    }),
                  })
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err?.error || 'Failed to submit claim')
                  }
                  const data = await res.json()
                  const claim = data?.claim
                  if (claim) setClaims((prev) => [claim, ...prev])
                  toast.success('Claim submitted')
                  setNewClaimOpen(false)
                  setNewClaimForm({ ticketNumber: '', claimReason: '', claimDescription: '', resolutionType: 'Redo Repair (Free)' })
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to submit claim')
                }
              }}
            >
              Submit Claim
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

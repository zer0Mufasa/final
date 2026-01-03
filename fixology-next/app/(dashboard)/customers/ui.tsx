'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { Customer } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import {
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  MessageSquare,
  Smartphone,
  Ticket as TicketIcon,
  Clock,
  PhoneCall,
  History,
  Crown,
  AlertTriangle,
  Flag,
  UserX,
  Sparkles,
} from 'lucide-react'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { toast } from '@/components/ui/toaster'

type Segment = 'all' | 'vip' | 'recent' | 'at-risk' | 'flagged'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

function timeAgo(iso: string) {
  const days = daysAgo(iso)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 90) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function CustomersClient() {
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<Segment>('all')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [profileTab, setProfileTab] = useState('overview')
  const [animationReady, setAnimationReady] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    const t = setTimeout(() => {
      setTimeout(() => setAnimationReady(true), 100)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const mapApiCustomerToUi = (c: any): Customer => {
    const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Customer'
    const lastVisit = (c.updatedAt || c.createdAt || new Date().toISOString()) as string
    return {
      id: c.id,
      firstName: c.firstName || 'Customer',
      lastName: c.lastName || '',
      name,
      phone: c.phone || '—',
      email: c.email || undefined,
      address: c.address || undefined,
      preferredContact: undefined,
      notes: c.notes || undefined,
      lastVisit,
      firstVisit: c.createdAt || undefined,
      openTickets: 0,
      totalTickets: c.ticketCount || 0,
      lifetimeValue: Number(c.totalSpent || 0),
      averageTicketValue: undefined,
      isVIP: !!c.isVip,
      isFlagged: false,
      flagReason: undefined,
      devices: [],
      tags: Array.isArray(c.tags) ? c.tags : [],
      createdAt: c.createdAt || undefined,
      updatedAt: c.updatedAt || undefined,
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        const sp = new URLSearchParams()
        if (query.trim()) sp.set('search', query.trim())
        const res = await fetch(`/api/customers?${sp.toString()}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `Failed to fetch customers (${res.status})`)
        const mapped = Array.isArray(data?.customers) ? data.customers.map(mapApiCustomerToUi) : []
        if (!cancelled) setCustomers(mapped)
      } catch (e: any) {
        if (!cancelled) setCustomers([])
        toast.error(e?.message || 'Failed to load customers')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const handle = setTimeout(run, query.trim() ? 250 : 0)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  // Segment counts
  const segmentCounts = useMemo(() => {
    const vip = customers.filter((c) => c.isVIP).length
    const recent = customers.filter((c) => daysAgo(c.lastVisit) <= 30).length
    const atRisk = customers.filter((c) => daysAgo(c.lastVisit) > 90).length
    const flagged = customers.filter((c) => c.isFlagged).length
    return { all: customers.length, vip, recent, 'at-risk': atRisk, flagged }
  }, [customers])

  // Filter by segment and search
  const filtered = useMemo(() => {
    let result = customers

    switch (segment) {
      case 'vip':
        result = result.filter((c) => c.isVIP)
        break
      case 'recent':
        result = result.filter((c) => daysAgo(c.lastVisit) <= 30)
        break
      case 'at-risk':
        result = result.filter((c) => daysAgo(c.lastVisit) > 90)
        break
      case 'flagged':
        result = result.filter((c) => c.isFlagged)
        break
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((c) =>
        `${c.name} ${c.phone} ${c.email || ''} ${c.devices?.map((d) => d.imei || d.model).join(' ') || ''}`.toLowerCase().includes(q)
      )
    }

    return result
  }, [customers, query, segment])

  // Stats
  const stats = useMemo(() => ({
    total: customers.length,
    totalValue: customers.reduce((sum, c) => sum + c.lifetimeValue, 0),
    vipCount: customers.filter(c => c.isVIP).length,
    activeThisMonth: customers.filter(c => daysAgo(c.lastVisit) <= 30).length,
  }), [customers])

  return (
    <div className="space-y-6 animate-page-in">
      {/* Enhanced Header */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Customers"
          description="Customer profiles, history, and quick actions for front desk operations."
          action={
            <Link href="/customers/new">
              <button
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
                Add Customer
                <Sparkles className="w-3 h-3 opacity-60" />
              </button>
            </Link>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {[
          { label: 'Total Customers', value: stats.total, icon: Users, color: 'purple' },
          { label: 'Lifetime Value', value: fmtMoney(stats.totalValue), icon: Crown, color: 'amber' },
          { label: 'VIP Customers', value: stats.vipCount, icon: Crown, color: 'emerald' },
          { label: 'Active This Month', value: stats.activeThisMonth, icon: Clock, color: 'blue' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative rounded-xl p-4 overflow-hidden cursor-pointer",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1"
              )}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-white/30 group-hover:text-purple-400/60 transition-colors" />
              </div>
              <div className="text-xs text-white/50 mb-1">{stat.label}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Segment Pills */}
      <div className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '150ms' }}>
        {[
          { key: 'all', label: 'All Customers', icon: Users, gradient: ['#8b5cf6', '#a855f7'] },
          { key: 'vip', label: 'VIP', icon: Crown, gradient: ['#f59e0b', '#d97706'] },
          { key: 'recent', label: 'Recent', icon: Clock, gradient: ['#10b981', '#059669'] },
          { key: 'at-risk', label: 'At Risk', icon: UserX, gradient: ['#f43f5e', '#e11d48'] },
          { key: 'flagged', label: 'Flagged', icon: Flag, gradient: ['#ef4444', '#dc2626'] },
        ].map((seg, i) => {
          const Icon = seg.icon
          const count = segmentCounts[seg.key as Segment]
          const isActive = segment === seg.key
          return (
            <button
              key={seg.key}
              onClick={() => setSegment(seg.key as Segment)}
              className={cn(
                'relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 inline-flex items-center gap-2 whitespace-nowrap',
                'hover:-translate-y-0.5',
                isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
              )}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${seg.gradient[0]} 0%, ${seg.gradient[1]} 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? `0 8px 20px ${seg.gradient[0]}40` : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {seg.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                isActive ? "bg-white/20" : "bg-white/10"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className={cn(
        "flex items-center gap-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        <div className="relative flex-1 max-w-[420px] group">
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
            placeholder="Search name, phone, email, IMEI…"
          />
        </div>
        <button
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm text-white/70",
            "transition-all duration-200",
            "hover:bg-white/[0.05] hover:text-white"
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          Sort
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '250ms' }}>
        {loading ? (
          <div
            className="p-6 rounded-2xl space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Users className="w-7 h-7 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {segment !== 'all' ? `No ${segment} customers` : 'No customers found'}
            </h3>
            <p className="text-sm text-white/50 mb-6">
              {segment !== 'all' ? `No customers match the "${segment}" segment.` : 'Try a different search, or add your first customer.'}
            </p>
            {segment !== 'all' ? (
              <button
                onClick={() => setSegment('all')}
                className="px-5 py-3 rounded-xl text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05]"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                View All Customers
              </button>
            ) : (
              <Link href="/customers/new">
                <button
                  className="px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="text-sm font-semibold text-white/85">
                {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
                {segment !== 'all' && <span className="text-white/50"> in {segment}</span>}
              </div>
              <div className="text-xs text-white/40">Click a row to open profile</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/[0.06]">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Devices</th>
                    <th className="px-5 py-3">Stats</th>
                    <th className="px-5 py-3">Last Visit</th>
                    <th className="px-5 py-3">Quick</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-white/[0.04] cursor-pointer transition-all duration-200",
                        "hover:bg-white/[0.03]",
                        c.isFlagged && "bg-red-500/[0.02]"
                      )}
                      onClick={() => setSelected(c)}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold",
                              "transition-all duration-300"
                            )}
                            style={{
                              background: c.isVIP
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : c.isFlagged
                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
                                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                              border: c.isVIP
                                ? 'none'
                                : c.isFlagged
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : '1px solid rgba(139, 92, 246, 0.3)',
                              color: c.isVIP ? 'white' : c.isFlagged ? '#fca5a5' : '#d8b4fe',
                              boxShadow: c.isVIP ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                            }}
                          >
                            {c.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{c.name}</span>
                              {c.isVIP && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    color: '#fcd34d',
                                  }}
                                >
                                  VIP
                                </span>
                              )}
                              {c.isFlagged && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                  style={{
                                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fca5a5',
                                  }}
                                >
                                  FLAGGED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/50">
                              {c.totalTickets || 0} repairs • {fmtMoney(c.lifetimeValue)} lifetime
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/30" />
                          {c.phone}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-white/30" />
                          {c.email || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {c.devices?.slice(0, 2).map((d) => (
                            <div key={d.id} className="text-xs text-white/60">
                              {d.type} {d.model}
                            </div>
                          ))}
                          {(c.devices?.length || 0) > 2 && (
                            <div className="text-xs text-white/40">+{(c.devices?.length || 0) - 2} more</div>
                          )}
                          {!c.devices?.length && <div className="text-xs text-white/40">No devices</div>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold">
                          {c.openTickets > 0 ? (
                            <span className="text-purple-300">{c.openTickets} open</span>
                          ) : (
                            <span className="text-white/40">No open</span>
                          )}
                        </div>
                        <div className="text-xs text-white/40">
                          Avg: {c.averageTicketValue ? fmtMoney(c.averageTicketValue) : '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={cn(
                          "text-sm font-semibold",
                          daysAgo(c.lastVisit) > 90 ? "text-rose-400" :
                          daysAgo(c.lastVisit) > 30 ? "text-amber-400" :
                          "text-white/70"
                        )}>
                          {timeAgo(c.lastVisit)}
                        </div>
                        {daysAgo(c.lastVisit) > 90 && (
                          <div className="text-xs text-rose-400/70">At risk</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`tel:${c.phone.replace(/\D/g, '')}`}
                            className="p-2 rounded-lg transition-all hover:bg-white/[0.08]"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <Phone className="w-4 h-4 text-white/60" />
                          </a>
                          <button
                            className="p-2 rounded-lg transition-all hover:bg-white/[0.08]"
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          >
                            <MessageSquare className="w-4 h-4 text-white/60" />
                          </button>
                          <Link href="/tickets/new">
                            <button
                              className="px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:scale-105"
                              style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                              }}
                            >
                              Ticket
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <Drawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null)
            setProfileTab('overview')
          }
        }}
        title={selected ? selected.name : 'Customer'}
        description={selected ? `${selected.phone} • ${selected.email || 'No email'}` : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {selected.isVIP && (
                <span
                  className="px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fcd34d',
                  }}
                >
                  <Crown className="w-3 h-3" /> VIP Customer
                </span>
              )}
              {selected.isFlagged && (
                <span
                  className="px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                  }}
                >
                  <AlertTriangle className="w-3 h-3" /> Flagged
                </span>
              )}
              {daysAgo(selected.lastVisit) > 90 && (
                <span
                  className="px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0.1) 100%)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                  }}
                >
                  <UserX className="w-3 h-3" /> At Risk
                </span>
              )}
            </div>

            {/* Flag reason */}
            {selected.isFlagged && selected.flagReason && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Flag Reason</span>
                </div>
                <div className="text-sm text-red-300/80">{selected.flagReason}</div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${selected.phone.replace(/\D/g, '')}`}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                }}
              >
                <PhoneCall className="w-4 h-4" />
                Call
              </a>
              <button
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Text
              </button>
              {selected.email && (
                <a
                  href={`mailto:${selected.email}`}
                  className="px-4 py-2.5 rounded-xl text-sm text-white/70 transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>

            <Tabs
              value={profileTab}
              onValueChange={setProfileTab}
              tabs={[
                { value: 'overview', label: 'Overview' },
                { value: 'devices', label: `Devices${selected.devices?.length ? ` (${selected.devices.length})` : ''}` },
                { value: 'history', label: 'History' },
              ]}
            />

            {profileTab === 'overview' ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Lifetime Value', value: fmtMoney(selected.lifetimeValue) },
                    { label: 'Total Repairs', value: selected.totalTickets || 0 },
                    { label: 'Avg Ticket', value: selected.averageTicketValue ? fmtMoney(selected.averageTicketValue) : '—' },
                    { label: 'Customer Since', value: selected.firstVisit ? timeAgo(selected.firstVisit) : '—' },
                  ].map((stat, i) => (
                    <div
                      key={stat.label}
                      className="rounded-xl px-4 py-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">{stat.label}</div>
                      <div className="text-lg font-bold text-white mt-1">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Preferences */}
                {(selected.preferredContact || selected.notes) && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div className="text-sm font-semibold text-white mb-3">Preferences</div>
                    {selected.preferredContact && (
                      <div className="text-sm text-white/60 mb-2">
                        Preferred contact: <span className="font-medium capitalize">{selected.preferredContact}</span>
                      </div>
                    )}
                    {selected.notes && (
                      <div className="text-sm text-white/60 italic">"{selected.notes}"</div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="text-sm font-semibold text-white mb-3">Quick Actions</div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/tickets/new">
                      <button
                        className="px-4 py-2.5 rounded-xl text-sm text-white/70 inline-flex items-center gap-2 transition-all hover:bg-white/[0.08]"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <TicketIcon className="w-4 h-4" /> New Ticket
                      </button>
                    </Link>
                    <button
                      className="px-4 py-2.5 rounded-xl text-sm text-white/70 transition-all hover:bg-white/[0.08]"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      Add Note
                    </button>
                    <button
                      className="px-4 py-2.5 rounded-xl text-sm text-white/70 transition-all hover:bg-white/[0.08]"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      Edit Profile
                    </button>
                    {!selected.isFlagged ? (
                      <button
                        className="px-4 py-2.5 rounded-xl text-sm text-amber-400 transition-all hover:bg-amber-500/10"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        Flag Customer
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2.5 rounded-xl text-sm text-emerald-400 transition-all hover:bg-emerald-500/10"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        Remove Flag
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : profileTab === 'devices' ? (
              <div className="space-y-3">
                {selected.devices && selected.devices.length > 0 ? (
                  selected.devices.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl p-4 transition-all hover:bg-white/[0.02]"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-4 h-4 text-purple-300" />
                        <div className="text-sm font-semibold text-white">{d.type} {d.model}</div>
                      </div>
                      {d.imei && (
                        <div className="text-xs text-white/50 font-mono">IMEI: {d.imei}</div>
                      )}
                      {d.serialNumber && (
                        <div className="text-xs text-white/50 font-mono">S/N: {d.serialNumber}</div>
                      )}
                      <div className="text-xs text-white/40 mt-1">{d.repairCount} repair{d.repairCount !== 1 ? 's' : ''}</div>
                      {d.notes && (
                        <div className="text-xs text-white/60 mt-2 italic">"{d.notes}"</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Smartphone className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <div className="text-sm text-white/40">No devices registered</div>
                  </div>
                )}
                <button
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white/70 inline-flex items-center justify-center gap-2 transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Device
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5 text-white/40" />
                  <div className="text-sm font-semibold text-white">Repair History</div>
                </div>
                {[
                  { date: 'Today', ticket: 'FIX-1041', device: 'iPhone 14 Pro • Screen', amount: 219, status: 'In Progress' },
                  { date: '2 weeks ago', ticket: 'FIX-1028', device: 'iPad Pro • Charging', amount: 169, status: 'Completed' },
                  { date: '1 month ago', ticket: 'FIX-1007', device: 'iPhone 14 Pro • Battery', amount: 149, status: 'Completed' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 transition-all hover:bg-white/[0.02]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/40">{item.date}</div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: item.status === 'Completed'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(139, 92, 246, 0.2)',
                          color: item.status === 'Completed' ? '#6ee7b7' : '#d8b4fe',
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">{item.ticket}</div>
                    <div className="text-xs text-white/50 mt-1">{item.device}</div>
                    <div className="text-sm font-semibold text-white/80 mt-2">{fmtMoney(item.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

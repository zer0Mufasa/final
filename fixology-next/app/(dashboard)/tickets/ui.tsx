'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ticketColumns } from '@/lib/mock/data'
import type { Ticket, TicketStatus } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { cn } from '@/lib/utils/cn'
import { Calendar, Filter, Plus, Search, SlidersHorizontal, Ticket as TicketIcon, CheckSquare, Square, Sparkles } from 'lucide-react'
import { KanbanBoard } from '@/components/tickets/kanban-board'
import { TicketDetailDrawer } from '@/components/tickets/ticket-detail-drawer'
import { GlassRow } from '@/components/workspace/glass-row'
import { CommandBar } from '@/components/workspace/command-bar'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'
import { toast } from '@/components/ui/toaster'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function TicketsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'table' | 'calendar'>('board')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [animationReady, setAnimationReady] = useState(false)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [staff, setStaff] = useState<string[]>([])

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Filters (table and board)
  const [status, setStatus] = useState<TicketStatus | 'ALL'>('ALL')
  const [tech, setTech] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [savedView, setSavedView] = useState<string>('default')

  useEffect(() => {
    const t = setTimeout(() => {
      setTimeout(() => setAnimationReady(true), 100)
    }, 650)
    return () => clearTimeout(t)
  }, [])

  const mapApiStatusToUi = (s: string): TicketStatus | 'ALL' => {
    switch (s) {
      case 'IN_PROGRESS':
        return 'IN_REPAIR'
      case 'PICKED_UP':
        return 'READY'
      case 'CANCELLED':
        return 'READY'
      default:
        return s as TicketStatus
    }
  }

  const mapUiStatusToApi = (s: TicketStatus): string => {
    switch (s) {
      case 'IN_REPAIR':
        return 'IN_PROGRESS'
      default:
        return s
    }
  }

  const mapApiTicketToUi = (t: any): Ticket => {
    const customerName = t?.customer
      ? `${t.customer.firstName ?? ''} ${t.customer.lastName ?? ''}`.trim() || 'Customer'
      : t?.customerName || 'Customer'
    const customerPhone = t?.customer?.phone || t?.customerPhone || '—'
    const customerEmail = t?.customer?.email || t?.customerEmail || undefined
    const device = `${t.deviceBrand ?? ''} ${t.deviceType ?? ''}${t.deviceModel ? ` ${t.deviceModel}` : ''}`.trim() || 'Device'
    const promisedAt = (t.dueAt || t.intakeAt || t.createdAt || new Date().toISOString()) as string

    return {
      id: t.id,
      ticketNumber: t.ticketNumber || t.ticket_number || 'FIX-????',
      customerId: t.customerId,
      customerName,
      customerPhone,
      customerEmail,
      device,
      deviceType: t.deviceType,
      deviceModel: t.deviceModel,
      imei: t.imei || undefined,
      passcode: t.passcode || undefined,
      issue: t.issueDescription || undefined,
      symptoms: Array.isArray(t.symptoms) ? t.symptoms : undefined,
      diagnosis: t.diagnosis || undefined,
      repairType: t.resolution || undefined,
      status: mapApiStatusToUi(String(t.status)) as TicketStatus,
      priority: (t.priority || 'medium')?.toString?.().toLowerCase?.() as any,
      promisedAt,
      createdAt: (t.createdAt || t.intakeAt || new Date().toISOString()) as string,
      startedAt: t.repairedAt || undefined,
      completedAt: t.completedAt || undefined,
      price: Number(t.estimatedCost || t.actualCost || 0),
      deposit: undefined,
      depositPaid: undefined,
      assignedTo: t.assignedTo?.name || undefined,
      risk: 'none',
      riskReasons: [],
      notes: [],
      statusHistory: [],
      source: 'walk-in',
      tags: [],
    }
  }

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const sp = new URLSearchParams()
      if (status !== 'ALL') sp.set('status', mapUiStatusToApi(status))
      // lightweight search is done client-side for now (keeps API unchanged)
      const res = await fetch(`/api/tickets?${sp.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to fetch tickets (${res.status})`)
      const mapped = Array.isArray(data?.tickets) ? data.tickets.map(mapApiTicketToUi) : []
      setTickets(mapped)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Load staff list for filters/assignment
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/staff', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to load staff')
        if (cancelled) return
        const names = Array.isArray(data) ? data.map((s: any) => s.name || s.email).filter(Boolean) : []
        setStaff(names)
      } catch {
        if (!cancelled) setStaff([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Open ticket drawer
  const openTicketDrawer = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDrawerOpen(true)
  }, [])

  // Handle status change from drawer
  const handleStatusChange = useCallback((ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              statusHistory: [
                ...(t.statusHistory || []),
                {
                  from: t.status,
                  to: newStatus,
                  changedBy: 'You',
                  changedAt: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    )
    setSelectedTicket((prev) =>
      prev?.id === ticketId ? { ...prev, status: newStatus } : prev
    )

    // Persist
    fetch(`/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: mapUiStatusToApi(newStatus) }),
    }).then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to update status (${r.status})`)
      }
      toast.success('Status updated')
    }).catch((e) => {
      toast.error(e?.message || 'Failed to update status')
    })
  }, [])

  // Handle tech assignment from drawer
  const handleAssign = useCallback((ticketId: string, techName: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assignedTo: techName || undefined } : t))
    )
    setSelectedTicket((prev) =>
      prev?.id === ticketId ? { ...prev, assignedTo: techName || undefined } : prev
    )

    // Persist (best-effort)
    fetch(`/api/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techName: techName || null }),
    }).then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.error || `Failed to assign (${r.status})`)
      }
      toast.success(techName ? `Assigned to ${techName}` : 'Unassigned')
    }).catch((e) => {
      toast.error(e?.message || 'Failed to assign tech')
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return

      const key = e.key.toLowerCase()
      if (key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push('/tickets/new')
      }
      if (key === 'escape' && drawerOpen) {
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router, drawerOpen])

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (status !== 'ALL' && t.status !== status) return false
      if (tech !== 'ALL' && (t.assignedTo || '—') !== tech) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const hay = `${t.ticketNumber} ${t.customerName} ${t.customerPhone} ${t.device}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tickets, status, tech, query])

  // Stats
  const stats = useMemo(() => {
    const total = tickets.length
    const intake = tickets.filter(t => t.status === 'INTAKE').length
    const inProgress = tickets.filter(t => t.status === 'IN_REPAIR').length
    const ready = tickets.filter(t => t.status === 'READY').length
    const overdue = tickets.filter(t => hoursFromNow(t.promisedAt) < 0).length
    return { total, intake, inProgress, ready, overdue }
  }, [tickets])

  return (
    <div className="space-y-6 animate-page-in">
      <CommandBar roleLabel="Owner" shopName="Demo Shop" />
      
      {/* Enhanced Header */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Tickets"
          description="Manage repair workflows with Kanban, list, or calendar views."
          action={
            <Link href="/tickets/new">
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
                Create Ticket
                <Sparkles className="w-3 h-3 opacity-60" />
              </button>
            </Link>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-5 gap-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {[
          { label: 'Total', value: stats.total, color: 'purple' },
          { label: 'Intake', value: stats.intake, color: 'blue' },
          { label: 'In Progress', value: stats.inProgress, color: 'amber' },
          { label: 'Ready', value: stats.ready, color: 'emerald' },
          { label: 'Overdue', value: stats.overdue, color: 'rose', warning: stats.overdue > 0 },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "group relative rounded-xl p-4 overflow-hidden",
              "transition-all duration-300 ease-out cursor-pointer",
              "hover:-translate-y-1"
            )}
            style={{
              background: stat.warning
                ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: stat.warning
                ? '1px solid rgba(244, 63, 94, 0.25)'
                : '1px solid rgba(255, 255, 255, 0.06)',
              animationDelay: `${i * 50}ms`,
            }}
          >
            <div className="text-xs text-white/50 mb-1">{stat.label}</div>
            <div className={cn(
              "text-2xl font-bold",
              stat.warning ? "text-rose-400" : "text-white"
            )}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '150ms' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as any)}
            tabs={[
              { value: 'board', label: 'Board' },
              { value: 'table', label: 'Table' },
              { value: 'calendar', label: 'Calendar' },
            ]}
          />
          {view === 'table' && (
            <div
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <select
                className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
                value={savedView}
                onChange={(e) => setSavedView(e.target.value)}
              >
                <option value="default">All Tickets</option>
                <option value="front-desk">Front Desk</option>
                <option value="tech-queue">Tech Queue</option>
                <option value="ready-pickup">Ready for Pickup</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-purple-400 transition-colors" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full sm:w-[320px] pl-11 pr-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]",
                "focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
              )}
              placeholder="Search ticket #, customer, device…"
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Filter className="w-4 h-4 text-white/40" aria-hidden="true" />
              <select
                className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ALL">All statuses</option>
                {ticketColumns.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4 text-white/40" aria-hidden="true" />
              <select
                className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
              >
                <option value="ALL">All techs</option>
                {staff.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              className={cn(
                "px-4 py-2.5 rounded-xl inline-flex items-center gap-2",
                "text-sm text-white/70",
                "transition-all duration-200",
                "hover:bg-white/[0.05] hover:text-white"
              )}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Date range
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        {loading ? (
          <div
            className="p-6 rounded-2xl space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white/60">Loading tickets…</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs text-white/40">Fetching data</span>
              </div>
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[72px] rounded-xl animate-pulse"
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
              <TicketIcon className="w-7 h-7 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No tickets match your filters</h3>
            <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
              Try clearing filters or create a new ticket to start a repair workflow.
            </p>
            <Link href="/tickets/new">
              <button
                className="px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Plus className="w-4 h-4" />
                Create Ticket
              </button>
            </Link>
          </div>
        ) : view === 'board' ? (
          <KanbanBoard tickets={filtered} setTickets={setTickets} onTicketClick={openTicketDrawer} />
        ) : view === 'table' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-white/50 px-1 mb-3">
              <span>Ticket list</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                {filtered.length} shown
              </span>
            </div>
            {filtered.map((t, i) => {
              const hrs = hoursFromNow(t.promisedAt)
              const promisedLabel = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
              const promisedColor = hrs >= 0 ? 'text-white/50' : 'text-rose-400'
              const isSelected = selectedTickets.has(t.id)
              return (
                <div
                  key={t.id}
                  className={cn(
                    "group relative rounded-xl p-4 cursor-pointer",
                    "transition-all duration-300 ease-out",
                    "hover:-translate-y-0.5",
                    isSelected && "ring-1 ring-purple-500/50"
                  )}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    animationDelay: `${i * 30}ms`,
                  }}
                  onClick={() => openTicketDrawer(t)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const ns = new Set(selectedTickets)
                          ns.has(t.id) ? ns.delete(t.id) : ns.add(t.id)
                          setSelectedTickets(ns)
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                        )}
                      </button>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{t.ticketNumber}</span>
                          <StatusBadge status={t.status} />
                          <span className={cn('text-xs font-medium', promisedColor)}>{promisedLabel}</span>
                          {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                        </div>
                        <div className="text-sm text-white/60 truncate">
                          {t.customerName} • {t.device}
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-2">
                          <span>{fmtMoney(t.price)}</span>
                          <span>• {t.assignedTo || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="px-3 py-2 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all"
                        onClick={(e) => { e.stopPropagation() }}
                      >
                        Message
                      </button>
                      <button
                        className="px-3 py-2 text-xs rounded-lg text-white font-medium transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/tickets/${t.id}`) }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="p-6 border-b border-white/[0.06]">
              <div className="text-sm font-semibold text-white mb-1">Calendar / Schedule view</div>
              <div className="text-xs text-white/40">Drag tickets between time slots (UI only)</div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-white/40 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'].map((time, ti) => (
                  <div
                    key={time}
                    className="rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.02]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <div className="text-xs font-semibold text-white/50 mb-3">{time}</div>
                    <div className="flex flex-wrap gap-2">
                      {filtered
                        .filter((t) => {
                          const hrs = hoursFromNow(t.promisedAt)
                          return hrs >= 0 && hrs <= 24
                        })
                        .slice(0, 3)
                        .map((t, i) => (
                          <div
                            key={t.id}
                            className="px-3 py-2 rounded-xl cursor-move transition-all duration-200 hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                            }}
                          >
                            <div className="text-xs font-semibold text-white">{t.ticketNumber}</div>
                            <div className="text-[10px] text-white/60">{t.customerName}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-white/30 text-center">
                Calendar view shows promised times. Drag & drop will be wired later.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
        staffOptions={staff}
      />
    </div>
  )
}

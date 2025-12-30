'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ticketColumns, mockTechs, mockTickets } from '@/lib/mock/data'
import type { Ticket, TicketStatus } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { cn } from '@/lib/utils/cn'
import { ArrowRight, Calendar, Filter, MessageSquare, Plus, Search, SlidersHorizontal, Ticket as TicketIcon, CheckSquare, Square, Download, Send, UserCheck } from 'lucide-react'
import { KanbanBoard } from '@/components/tickets/kanban-board'
import { GlassRow } from '@/components/workspace/glass-row'
import { CommandBar } from '@/components/workspace/command-bar'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'

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
  const [view, setView] = useState<'board' | 'table' | 'calendar'>('table')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())

  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)

  // Filters (table and board)
  const [status, setStatus] = useState<TicketStatus | 'ALL'>('ALL')
  const [tech, setTech] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [savedView, setSavedView] = useState<string>('default')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

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

  return (
    <div className="space-y-4">
      <CommandBar roleLabel="Owner" shopName="Demo Shop" />
      <PageHeader
        title="Tickets"
        description="Dense workboard — list first, with Kanban when you need it."
        action={
          <Link href="/tickets/new">
            <ButtonPrimary className="gap-2">
              <Plus className="w-4 h-4" />
              Create Ticket
            </ButtonPrimary>
          </Link>
        }
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex items-center gap-3">
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
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2">
              <select
                className="bg-transparent text-sm text-white/75 outline-none"
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-11 bg-white/[0.04] border-white/10 w-full sm:w-[320px]"
              placeholder="Search ticket #, customer, device…"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2">
              <Filter className="w-4 h-4 text-white/45" aria-hidden="true" />
              <select className="bg-transparent text-sm text-white/75 outline-none" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="ALL">All statuses</option>
                {ticketColumns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-3 py-2">
              <SlidersHorizontal className="w-4 h-4 text-white/45" aria-hidden="true" />
              <select className="bg-transparent text-sm text-white/75 outline-none" value={tech} onChange={(e) => setTech(e.target.value)}>
                <option value="ALL">All techs</option>
                {mockTechs.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-secondary px-4 py-2 rounded-xl inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Date range
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <GlassCard className="p-0 overflow-hidden rounded-3xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-white/80">Loading tickets…</div>
            <div className="text-xs text-white/45">Fetching mock data</div>
          </div>
          <div className="p-6 space-y-3">
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[72px] rounded-2xl" />
          </div>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<TicketIcon className="w-8 h-8" aria-hidden="true" />}
            title="No tickets match your filters"
            description="Try clearing filters or create a new ticket to start a repair workflow."
            cta={
              <Link href="/tickets/new" className="btn-primary px-5 py-3 rounded-xl inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Create Ticket
              </Link>
            }
          />
        </GlassCard>
      ) : view === 'board' ? (
        <KanbanBoard tickets={filtered} setTickets={setTickets} />
      ) : view === 'table' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/60 px-1">
            <span>Ticket list</span>
            <span>{filtered.length} shown</span>
          </div>
          {filtered.map((t) => {
            const hrs = hoursFromNow(t.promisedAt)
            const promisedLabel = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
            const promisedColor = hrs >= 0 ? 'text-white/55' : 'text-red-300'
            const isSelected = selectedTickets.has(t.id)
            return (
              <GlassRow
                key={t.id}
                className={cn(
                  'justify-between cursor-pointer',
                  isSelected && 'border-purple-400/40 bg-purple-500/10'
                )}
                onClick={() => router.push(`/tickets/${t.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const ns = new Set(selectedTickets)
                      ns.has(t.id) ? ns.delete(t.id) : ns.add(t.id)
                      setSelectedTickets(ns)
                    }}
                    className="p-1 rounded hover:bg-white/10"
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4 text-purple-300" /> : <Square className="w-4 h-4 text-white/35" />}
                  </button>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{t.ticketNumber}</span>
                      <StatusBadge status={t.status} />
                      <span className={cn('text-xs font-semibold', promisedColor)}>{promisedLabel}</span>
                      {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                    </div>
                    <div className="text-sm text-white/70 truncate">
                      {t.customerName} • {t.device}
                    </div>
                    <div className="text-xs text-white/45 flex items-center gap-2">
                      <span>{fmtMoney(t.price)}</span>
                      <span>• {t.assignedTo || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition">
                  <ButtonSecondary className="px-3 py-2 text-xs rounded-lg" onClick={(e) => { e.stopPropagation(); }}>
                    Message
                  </ButtonSecondary>
                  <ButtonPrimary className="px-3 py-2 text-xs rounded-lg" onClick={(e) => { e.stopPropagation(); router.push(`/tickets/${t.id}`) }}>
                    Open
                  </ButtonPrimary>
                </div>
              </GlassRow>
            )
          })}
        </div>
      ) : (
        <GlassCard className="p-0 overflow-hidden rounded-3xl">
          <div className="p-6 border-b border-white/10">
            <div className="text-sm font-semibold text-white/85 mb-1">Calendar / Schedule view</div>
            <div className="text-xs text-white/45">Drag tickets between time slots (UI only)</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-white/50 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'].map((time) => (
                <div key={time} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-xs font-semibold text-white/60 mb-3">{time}</div>
                  <div className="flex flex-wrap gap-2">
                    {filtered
                      .filter((t) => {
                        const hrs = hoursFromNow(t.promisedAt)
                        return hrs >= 0 && hrs <= 24
                      })
                      .slice(0, 3)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 cursor-move hover:bg-purple-500/30 transition-colors"
                        >
                          <div className="text-xs font-semibold text-white/90">{t.ticketNumber}</div>
                          <div className="text-[10px] text-white/60">{t.customerName}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-white/40 text-center">
              Calendar view shows promised times. Drag & drop will be wired later.
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}



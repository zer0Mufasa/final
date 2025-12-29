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
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { cn } from '@/lib/utils/cn'
import { ArrowRight, Calendar, Filter, MessageSquare, Plus, Search, SlidersHorizontal, Ticket as TicketIcon, CheckSquare, Square, Download, Send, UserCheck } from 'lucide-react'
import { KanbanBoard } from '@/components/tickets/kanban-board'

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
    <div>
      <PageHeader
        title="Tickets"
        description="Board-first workflow: intake → diagnose → parts → repair → ready → pickup. Drag tickets as the work progresses."
        action={
          <Link href="/tickets/new">
            <Button rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />} leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
              Create Ticket
            </Button>
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
        <GlassCard className="p-0 overflow-hidden rounded-3xl">
          {/* Bulk actions bar */}
          {selectedTickets.size > 0 && (
            <div className="p-4 border-b border-white/10 bg-purple-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white/90">
                  {selectedTickets.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary px-3 py-2 text-xs rounded-xl inline-flex items-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    Assign tech
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs rounded-xl inline-flex items-center gap-2">
                    <SlidersHorizontal className="w-3 h-3" />
                    Move status
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs rounded-xl inline-flex items-center gap-2">
                    <Send className="w-3 h-3" />
                    Send update
                  </button>
                  <button className="btn-secondary px-3 py-2 text-xs rounded-xl inline-flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedTickets(new Set())}
                className="text-xs text-white/50 hover:text-white/80"
              >
                Clear
              </button>
            </div>
          )}

          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-white/85">Ticket list</div>
            <div className="text-xs text-white/45">{filtered.length} shown</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/45 border-b border-white/10">
                  <th className="px-4 py-3 w-12">
                    <button
                      onClick={() => {
                        if (selectedTickets.size === filtered.length) {
                          setSelectedTickets(new Set())
                        } else {
                          setSelectedTickets(new Set(filtered.map((t) => t.id)))
                        }
                      }}
                      className="p-1 hover:bg-white/5 rounded transition-colors"
                    >
                      {selectedTickets.size === filtered.length ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/40" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tech</th>
                  <th className="px-4 py-3">Promised</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const hrs = hoursFromNow(t.promisedAt)
                  const promisedLabel = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
                  const promisedCls = hrs >= 0 ? 'text-white/55' : 'text-red-300'
                  const isSelected = selectedTickets.has(t.id)
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                      className={cn(
                        'border-b border-white/10 hover:bg-white/[0.03] transition-colors cursor-pointer',
                        isSelected && 'bg-purple-500/10'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const newSet = new Set(selectedTickets)
                            if (newSet.has(t.id)) {
                              newSet.delete(t.id)
                            } else {
                              newSet.add(t.id)
                            }
                            setSelectedTickets(newSet)
                          }}
                          className="p-1 hover:bg-white/5 rounded transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-white/40" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white/90">{t.ticketNumber}</td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        <div className="font-semibold">{t.customerName}</div>
                        <div className="text-xs text-white/45">{t.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">{t.device}</td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-sm text-white/70">{t.assignedTo || '—'}</td>
                      <td className={cn('px-4 py-3 text-sm font-semibold', promisedCls)}>{promisedLabel}</td>
                      <td className="px-4 py-3">{t.risk !== 'none' ? <RiskBadge risk={t.risk} /> : <span className="text-white/30">—</span>}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white/85">{fmtMoney(t.price)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-ghost px-3 py-2 text-xs rounded-xl">Message</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
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



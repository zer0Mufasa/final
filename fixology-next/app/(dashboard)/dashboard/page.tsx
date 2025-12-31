'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { mockTickets } from '@/lib/mock/data'
import type { Ticket } from '@/lib/mock/types'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'
import { cn } from '@/lib/utils/cn'
import { ArrowUpRight, ArrowDownRight, Calendar, ChevronRight, Filter, Plus } from 'lucide-react'

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

type Activity = {
  id: number
  emoji: string
  text: string
  at: Date
  amount?: number
}

function timeAgo(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const MOCK_ACTIVITY: Activity[] = [
  { id: 1, emoji: '💳', text: 'Payment received for FIX-1045', amount: 199, at: new Date(Date.now() - 18 * 60 * 1000) },
  { id: 2, emoji: '🔄', text: 'FIX-1044 moved to In Repair', at: new Date(Date.now() - 46 * 60 * 1000) },
  { id: 3, emoji: '💬', text: 'Customer message received (Taylor Brooks)', at: new Date(Date.now() - 72 * 60 * 1000) },
  { id: 4, emoji: '📦', text: 'Parts shipped for FIX-1043', at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
]

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<string>(mockTickets[0]?.id || '')
  const [quickIntake, setQuickIntake] = useState('')
  const [viewMode, setViewMode] = useState<'queue' | 'kanban'>('queue')

  const selected = useMemo(() => mockTickets.find((t) => t.id === selectedId) || mockTickets[0], [selectedId])

  const stats = useMemo(() => {
    const active = mockTickets.filter((t) => t.status !== 'READY' && t.status !== 'PICKED_UP')
    const ready = mockTickets.filter((t) => t.status === 'READY')
    const atRisk = mockTickets.filter((t) => t.risk === 'medium' || t.risk === 'high')
    const openValue = mockTickets.filter((t) => t.status !== 'PICKED_UP').reduce((s, t) => s + t.price, 0)
    const collected = ready.reduce((s, t) => s + t.price, 0)
    const overdue = active.filter((t) => hoursFromNow(t.promisedAt) < 0).length
    return {
      active: active.length,
      ready: ready.length,
      atRisk: atRisk.length,
      overdue,
      openValue,
      collected,
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-1px)] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white/95 tracking-tight">Good evening, Mufasa</h1>
          <p className="text-sm text-white/50 mt-1">
            {stats.active} active repairs • {stats.ready} ready for pickup • {money(stats.openValue)} open value
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.06] transition-all inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <Link href="/tickets/new" className="btn-primary px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard emoji="🔧" label="Active Repairs" value={String(stats.active)} change="+2 today" changeType="up" />
        <StatCard
          emoji="⚠️"
          label="Needs Attention"
          value={String(stats.atRisk)}
          sublabel={`${stats.overdue} overdue`}
          variant="warning"
        />
        <StatCard emoji="✅" label="Ready for Pickup" value={String(stats.ready)} sublabel="Notify customers" />
        <StatCard
          emoji="💰"
          label="Today's Revenue"
          value={money(stats.collected)}
          sublabel={`of ${money(stats.openValue)} total`}
          change="+18%"
          changeType="up"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Queue */}
        <section className="col-span-12 xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-medium text-white/80">Today's Queue</h2>
              <div className="flex items-center p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setViewMode('queue')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                    viewMode === 'queue' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  Queue
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                    viewMode === 'kanban' ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  Kanban
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                <Filter className="w-4 h-4 text-white/50" />
              </button>
              <span className="text-xs text-white/40">{mockTickets.length} tickets</span>
            </div>
          </div>

          {/* Queue rows */}
          <div className="space-y-2">
            {mockTickets.map((t) => (
              <TicketRow key={t.id} ticket={t} selected={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
            ))}
          </div>
        </section>

        {/* Side panel */}
        <aside className="col-span-12 xl:col-span-5 space-y-4">
          <QuickIntakeCard value={quickIntake} onChange={setQuickIntake} />
          {selected ? <TicketDetailCard ticket={selected} /> : null}
          <ActivityFeed items={MOCK_ACTIVITY} />
        </aside>
      </div>
    </div>
  )
}

function StatCard({
  emoji,
  label,
  value,
  sublabel,
  change,
  changeType,
  variant = 'default',
}: {
  emoji: string
  label: string
  value: string
  sublabel?: string
  change?: string
  changeType?: 'up' | 'down'
  variant?: 'default' | 'warning'
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl border transition-all hover:border-white/[0.10] group',
        variant === 'warning' ? 'bg-amber-500/[0.06] border-amber-500/20' : 'bg-white/[0.02] border-white/[0.06]'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl opacity-80 group-hover:opacity-100 transition-opacity">{emoji}</span>
        {change ? (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md',
              changeType === 'down' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
            )}
          >
            {changeType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {change}
          </span>
        ) : null}
      </div>
      <div className={cn('text-2xl font-semibold mb-0.5', variant === 'warning' ? 'text-amber-400' : 'text-white/95')}>
        {value}
      </div>
      <div className="text-xs text-white/50">{label}</div>
      {sublabel ? <div className="text-xs text-white/30 mt-1">{sublabel}</div> : null}
    </div>
  )
}

function TicketRow({
  ticket,
  selected,
  onClick,
}: {
  ticket: Ticket
  selected: boolean
  onClick: () => void
}) {
  const hrs = hoursFromNow(ticket.promisedAt)
  const overdue = hrs < 0 && ticket.status !== 'READY' && ticket.status !== 'PICKED_UP'
  const dueLabel =
    ticket.status === 'READY'
      ? 'Pickup ready'
      : ticket.status === 'PICKED_UP'
      ? 'Closed'
      : overdue
      ? `${Math.abs(hrs)}h overdue`
      : `Due in ${Math.max(0, hrs)}h`

  const progress =
    ticket.status === 'INTAKE'
      ? 15
      : ticket.status === 'DIAGNOSED'
      ? 35
      : ticket.status === 'WAITING_PARTS'
      ? 55
      : ticket.status === 'IN_REPAIR'
      ? 75
      : 100

  const issue = ticket.device.includes('•') ? ticket.device.split('•')[1]?.trim() : 'Repair'
  const deviceName = ticket.device.includes('•') ? ticket.device.split('•')[0]?.trim() : ticket.device

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all group',
        selected
          ? 'bg-violet-500/[0.08] border-violet-500/30'
          : overdue
          ? 'bg-rose-500/[0.04] border-rose-500/20 hover:border-rose-500/40'
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono text-white/40">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            {ticket.risk !== 'none' ? <RiskBadge risk={ticket.risk} /> : null}
          </div>
          <div className="text-sm font-medium text-white/90 mb-0.5">{ticket.customerName}</div>
          <div className="text-xs text-white/50">
            {deviceName} • {issue}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-base font-semibold text-white/90">{money(ticket.price)}</div>
          <div className={cn('text-xs mt-0.5', overdue ? 'text-rose-400 font-medium' : 'text-white/40')}>{dueLabel}</div>
          <div className="text-xs text-white/30 mt-0.5">Tech: {ticket.assignedTo || '—'}</div>
        </div>

        <ChevronRight className={cn('w-4 h-4 text-white/20 group-hover:text-white/40 transition-all shrink-0 mt-1', selected && 'text-violet-400')} />
      </div>

      <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', overdue ? 'bg-rose-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500')}
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  )
}

function QuickIntakeCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.04] border border-violet-500/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✨</span>
        <h3 className="text-sm font-medium text-white/90">Quick Intake</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-medium">AI</span>
      </div>
      <p className="text-xs text-white/50 mb-3">Describe the repair in plain English</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., iPhone 14 Pro cracked screen, customer wants same-day..."
        className="w-full h-16 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 resize-none outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
      />
      <div className="flex gap-2 mt-3">
        <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20">
          Start Intake →
        </button>
        <button className="px-4 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 hover:bg-white/[0.06] transition-all">
          Manual
        </button>
      </div>
    </div>
  )
}

function TicketDetailCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/80">Ticket Detail</h3>
        <span className="text-xs text-white/40 font-mono">{ticket.ticketNumber}</span>
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center text-white/80 font-semibold text-sm">
          {ticket.customerName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/90">{ticket.customerName}</div>
          <div className="text-xs text-white/50">{ticket.device}</div>
          <div className="text-xs text-white/30 mt-1">{ticket.customerPhone}</div>
        </div>
        <Link href={`/tickets/${ticket.id}`} className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5">
          Open <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">Total</span>
          <span className="text-sm font-semibold text-white/90">{money(ticket.price)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-xs text-white/50">Assigned</span>
          <span className="text-sm text-white/70">{ticket.assignedTo || '—'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <ButtonSecondary className="flex-1 px-4 py-2 rounded-xl text-sm">Edit</ButtonSecondary>
        <ButtonPrimary className="flex-1 px-4 py-2 rounded-xl text-sm">Take Payment</ButtonPrimary>
      </div>
    </div>
  )
}

function ActivityFeed({ items }: { items: Activity[] }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/80">Activity Feed</h3>
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all</button>
      </div>

      <div className="space-y-3">
        {items.slice(0, 5).map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <span className="text-base opacity-70">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/70 leading-relaxed">{a.text}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{timeAgo(a.at)}</div>
            </div>
            {typeof a.amount === 'number' ? <span className="text-xs font-medium text-emerald-400">+{money(a.amount)}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}


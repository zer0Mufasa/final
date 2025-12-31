'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Command,
  Flame,
  LayoutDashboard,
  Ticket,
  Users,
  Smartphone,
  Boxes,
  FileText,
  CreditCard,
  Wallet,
  BarChart3,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react'
import { Chip } from '@/components/workspace/chip'
import { SoftButton } from '@/components/workspace/soft-button'

type Role = 'FRONT_DESK' | 'TECH' | 'OWNER'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const MOCK_QUEUE = [
  {
    id: 'FIX-1041',
    customer: 'Jordan Lee',
    device: 'iPhone 14 Pro',
    issue: 'Screen',
    stage: 'Intake',
    due: '6h',
    tech: 'Ava',
    price: 219,
    risk: 'none' as const,
  },
  {
    id: 'FIX-1042',
    customer: 'Maya Patel',
    device: 'Samsung S23 Ultra',
    issue: 'Battery',
    stage: 'Diagnosed',
    due: '10h',
    tech: 'Noah',
    price: 149,
    risk: 'low' as const,
  },
  {
    id: 'FIX-1043',
    customer: 'Chris Nguyen',
    device: 'Google Pixel 8',
    issue: 'Charging Port',
    stage: 'Waiting Parts',
    due: '26h',
    tech: 'Miles',
    price: 179,
    risk: 'watch' as const,
  },
  {
    id: 'FIX-1044',
    customer: 'Taylor Brooks',
    device: 'iPad Air',
    issue: 'LCD',
    stage: 'In Repair',
    due: 'Late 4h',
    tech: 'Sofia',
    price: 329,
    risk: 'high' as const,
  },
  {
    id: 'FIX-1045',
    customer: 'Aiden Kim',
    device: 'iPhone 13',
    issue: 'Screen',
    stage: 'Ready',
    due: 'Late 18h',
    tech: 'Ava',
    price: 199,
    risk: 'none' as const,
  },
]

function RiskPill({ risk }: { risk: 'none' | 'low' | 'watch' | 'high' }) {
  const map = {
    none: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/25',
    low: 'bg-sky-500/10 text-sky-200 border-sky-500/25',
    watch: 'bg-amber-500/10 text-amber-200 border-amber-500/25',
    high: 'bg-rose-500/10 text-rose-200 border-rose-500/25',
  } as const
  const label = { none: 'On track', low: 'Low risk', watch: 'Watch', high: 'High risk' }[risk]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium', map[risk])}>
      {risk === 'high' ? <AlertTriangle className="w-3 h-3" /> : risk === 'watch' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {label}
    </span>
  )
}

function StagePill({ stage }: { stage: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 text-xs font-medium">
      {stage}
    </span>
  )
}

function StatPill({
  icon,
  label,
  value,
  sub,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'warn'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white/5 backdrop-blur-xl px-4 py-3',
        tone === 'warn' ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
          <div className="text-lg font-semibold text-white/90">{value}</div>
          {sub ? <div className="text-xs text-white/50 mt-0.5">{sub}</div> : null}
        </div>
        <div className={cn('h-9 w-9 rounded-xl border flex items-center justify-center', tone === 'warn' ? 'border-amber-300/40 bg-amber-500/10' : 'border-white/10 bg-white/5')}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-white/90">{title}</div>
        {hint ? <div className="text-xs text-white/60 mt-0.5">{hint}</div> : null}
      </div>
      {right}
    </div>
  )
}

/**
 * Lavender Light Workspace Dashboard (UI-only)
 * - Queue-first center column
 * - Inspector rail on right
 * - Clean sidebar + command bar
 */
export default function DashboardPage() {
  const [role, setRole] = useState<Role>('OWNER')
  const [query, setQuery] = useState('')
  const [intakeText, setIntakeText] = useState('')
  const [selectedId, setSelectedId] = useState(MOCK_QUEUE[0]?.id || '')

  const queue = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_QUEUE
    return MOCK_QUEUE.filter((t) => {
      const hay = `${t.id} ${t.customer} ${t.device} ${t.issue} ${t.stage}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const activeCount = MOCK_QUEUE.filter((t) => t.stage !== 'Ready').length
  const atRiskCount = MOCK_QUEUE.filter((t) => t.risk === 'watch' || t.risk === 'high').length
  const openRevenue = MOCK_QUEUE.reduce((a, t) => a + t.price, 0)
  const selected = queue.find((t) => t.id === selectedId) || queue[0] || MOCK_QUEUE[0]

  const grouped = useMemo(() => {
    const overdue = queue.filter((t) => t.due.toLowerCase().includes('late'))
    const soon = queue.filter((t) => !t.due.toLowerCase().includes('late') && parseInt(t.due) <= 8)
    const normal = queue.filter((t) => !overdue.includes(t) && !soon.includes(t))
    return { overdue, soon, normal }
  }, [queue])

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* ambient lavender glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 0% 0%, rgba(139, 92, 246, 0.12), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(168, 85, 247, 0.08), transparent 50%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-[88px_1fr] lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR */}
        {/* MAIN (full-width, no sidebar) */}
        <main className="min-h-screen col-span-2">
          {/* TOPBAR / COMMAND BAR */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07070a]/85 backdrop-blur-xl">
            <div className="px-4 lg:px-8 py-3 flex items-center gap-3">
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-white/50">
                <span className="font-medium text-white/80">Demo Shop</span>
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ticket #, phone, IMEI, device…"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/40 pl-9 pr-20 py-2.5 outline-none focus:border-[#8B5CF6]/50 focus:ring-2 focus:ring-[#8B5CF6]/25"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-white/40">
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                      <Command className="w-3 h-3" /> K
                    </span>
                  </div>
                </div>
              </div>

              {/* Role pills */}
              <div className="hidden lg:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-1 py-1">
                <RolePill label="Front Desk" active={role === 'FRONT_DESK'} onClick={() => setRole('FRONT_DESK')} />
                <RolePill label="Tech" active={role === 'TECH'} onClick={() => setRole('TECH')} />
                <RolePill label="Owner" active={role === 'OWNER'} onClick={() => setRole('OWNER')} />
              </div>

              {/* Actions */}
              <button className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-fuchsia-500 transition">
                <Plus className="w-4 h-4" /> New
              </button>

              <button className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 w-10 h-10 hover:border-white/20 hover:bg-white/10 transition">
                <Bell className="w-4 h-4 text-white/70" />
              </button>

              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 hover:border-white/20 hover:bg-white/10 transition">
                <div className="h-8 w-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center text-xs font-bold text-white">
                  DU
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold leading-tight text-white/90">Demo User</div>
                  <div className="text-xs text-white/50 leading-tight">{role === 'OWNER' ? 'Owner' : role === 'TECH' ? 'Tech' : 'Front Desk'}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="px-4 lg:px-8 py-6">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white/95">Today at Demo Shop</h1>
                <p className="text-sm text-white/60 mt-1">
                  Calm command center. See the queue first, then act.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-fuchsia-500 transition">
                Create Ticket <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats (pills, not loud cards) */}
            <div className="grid gap-3 mt-5 md:grid-cols-3">
              <StatPill icon={<Ticket className="w-4 h-4 text-white/70" />} label="Active" value={`${activeCount}`} sub="In progress today" />
              <StatPill icon={<Flame className="w-4 h-4 text-amber-300" />} label="At risk" value={`${atRiskCount}`} sub="Needs attention" tone="warn" />
              <StatPill icon={<CreditCard className="w-4 h-4 text-white/70" />} label="Open revenue" value={money(openRevenue)} sub="Work value in queue" />
            </div>

            {/* Main grid: Timeline / Workbench / Money+Comms */}
            <div className="grid gap-4 mt-5 xl:grid-cols-[1.2fr_1.4fr_1fr]">
              {/* TIMELINE */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white/90">Timeline</div>
                    <div className="text-xs text-white/50">Overdue → Due soon → Normal</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
                    <Chip muted className="border-white/[0.08] bg-white/[0.04] text-white/70">Today</Chip>
                    <Chip muted className="border-white/[0.08] bg-white/[0.04] text-white/70">Overdue</Chip>
                    <Chip muted className="border-white/[0.08] bg-white/[0.04] text-white/70">Upcoming</Chip>
                  </div>
                </div>
                <div className="divide-y divide-white/10">
                  {renderGroup('Overdue', grouped.overdue, setSelectedId)}
                  {renderGroup('Due soon', grouped.soon, setSelectedId)}
                  {renderGroup('Normal', grouped.normal, setSelectedId)}
                </div>
              </section>

              {/* WORKBENCH */}
              <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <SectionTitle title="Workbench" hint="Current ticket focus." />
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-sm font-semibold text-[#C4B5FD]">
                        {selected.device.split(' ')[0]}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-lg font-semibold text-white/90">{selected.customer}</div>
                          <Chip muted className="border-white/[0.08] bg-white/[0.04] text-white/70">{selected.device}</Chip>
                          <Chip muted className="border-white/[0.08] bg-white/[0.04] text-white/70">{selected.stage}</Chip>
                        </div>
                        <div className="text-sm text-white/60">Issue: {selected.issue}</div>
                        <div className="text-sm text-white/50">Tech {selected.tech} • {selected.due}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <SoftButton tone="outline" className="border-white/15 text-white">Continue Intake</SoftButton>
                      <SoftButton tone="outline" className="border-white/15 text-white">Mark Ready</SoftButton>
                      <SoftButton tone="primary" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none">Take Payment</SoftButton>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-white/85">Next steps</div>
                      <ul className="space-y-1 text-sm text-white/60">
                        <li>• Confirm parts arrival</li>
                        <li>• Capture final diagnostics note</li>
                        <li>• Prepare payment summary</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="text-sm font-semibold text-white/85 mb-1">Latest note</div>
                      <div className="text-sm text-white/60">“Customer approved estimate, wants ready by tonight.”</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/50">Select a ticket in the timeline.</div>
                )}
              </section>

              {/* MONEY + COMMS */}
              <aside className="space-y-4">
                <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5">
                  <SectionTitle title="Payment snapshot" />
                  <div className="space-y-1 mt-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Open revenue</span>
                      <span className="font-semibold text-white/90">{money(openRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deposit paid</span>
                      <span className="font-semibold text-white/70">{money(openRevenue * 0.15)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Remaining</span>
                      <span className="font-semibold text-white/90">{money(openRevenue * 0.85)}</span>
                    </div>
                  </div>
                  <SoftButton className="w-full mt-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none" tone="primary">
                    Open Checkout
                  </SoftButton>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5">
                  <SectionTitle title="Customer comms" />
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="w-full min-h-[90px] rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/20"
                      placeholder="Type a quick update to the customer…"
                    />
                    <div className="flex items-center gap-2">
                      <SoftButton tone="outline" className="flex-1 border-white/15 text-white">
                        <MessageCircle className="w-4 h-4" /> Send update
                      </SoftButton>
                      <SoftButton tone="primary" className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-none">
                        Request approval
                      </SoftButton>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5">
                  <SectionTitle title="Signals" />
                  <div className="mt-3 space-y-2 text-sm text-white/70">
                    <SignalRow label="Overdue" value={`${grouped.overdue.length}`} tone="danger" />
                    <SignalRow label="At risk" value={`${atRiskCount}`} tone="warn" />
                    <SignalRow label="Open revenue" value={money(openRevenue)} tone="default" />
                  </div>
                </section>
              </aside>
            </div>

            {/* Footer spacing */}
            <div className="h-10" />
          </div>
        </main>
      </div>
    </div>
  )
}

/* -------------------- Small UI primitives -------------------- */

function SideLink({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition border',
        active
          ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/25 text-white'
          : 'bg-transparent border-transparent text-white/60 hover:bg-white/5 hover:border-white/10'
      )}
    >
      <div className={cn('h-9 w-9 rounded-2xl flex items-center justify-center border', active ? 'bg-white/10 border-[#8B5CF6]/30' : 'bg-white/5 border-white/10')}>
        <div className={cn(active ? 'text-[#C4B5FD]' : 'text-white/60')}>{icon}</div>
      </div>
      <div className="hidden lg:block text-sm font-semibold text-white/80">{label}</div>
    </button>
  )
}

function RolePill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-2xl text-sm font-semibold transition',
        active ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/30' : 'text-white/60 hover:bg-white/5'
      )}
      type="button"
    >
      {label}
    </button>
  )
}

function SignalRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'default' | 'warn' | 'danger'
}) {
  const toneCls =
    tone === 'danger'
      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
      : tone === 'warn'
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
      : 'bg-white/5 border-white/10 text-white/80'

  return (
    <div className={cn('flex items-center justify-between rounded-2xl border px-3 py-2.5', toneCls)}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  )
}

function renderGroup(label: string, items: typeof MOCK_QUEUE, onSelect: (id: string) => void) {
  if (!items.length) return null
  return (
    <div className="p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-white/50 px-1">{label}</div>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="w-full text-left px-3 py-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white/85">{t.id}</span>
              <StagePill stage={t.stage} />
            </div>
            <div className="text-sm text-white/70 truncate">
              {t.customer} • {t.device}
            </div>
            <div className="text-xs text-white/50">{t.due}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/50" />
          </div>
        </button>
      ))}
    </div>
  )
}

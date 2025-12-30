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
    none: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/15',
    low: 'bg-sky-500/10 text-sky-700 border-sky-500/15',
    watch: 'bg-amber-500/10 text-amber-700 border-amber-500/15',
    high: 'bg-rose-500/10 text-rose-700 border-rose-500/15',
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
    <span className="inline-flex items-center px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium">
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
        'rounded-2xl border bg-white/80 backdrop-blur-md px-4 py-3',
        tone === 'warn' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-lg font-semibold text-slate-900">{value}</div>
          {sub ? <div className="text-xs text-slate-500 mt-0.5">{sub}</div> : null}
        </div>
        <div className={cn('h-9 w-9 rounded-xl border flex items-center justify-center', tone === 'warn' ? 'border-amber-200 bg-white' : 'border-slate-200 bg-white')}>
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
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {hint ? <div className="text-xs text-slate-500 mt-0.5">{hint}</div> : null}
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
    <div className="min-h-screen bg-[#F7F6FB] text-slate-900">
      {/* subtle lavender wash */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          background:
            'radial-gradient(900px 520px at 20% 10%, rgba(139,124,246,0.18), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(167,139,250,0.14), transparent 55%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-[88px_1fr] lg:grid-cols-[300px_1fr]">
        {/* SIDEBAR */}
        <aside className="h-screen sticky top-0 border-r border-slate-200 bg-white/70 backdrop-blur-xl">
          <div className="h-full flex flex-col">
            {/* Brand */}
            <div className="px-4 py-4 lg:px-5 border-b border-slate-200/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
                  <span className="text-base font-bold text-[#6F5CF6]">F</span>
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold leading-tight">Fixology</div>
                  <div className="text-xs text-slate-500 leading-tight">Lavender Workspace</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-auto px-2 py-3 lg:px-3 space-y-6">
              <div>
                <div className="hidden lg:block px-2 text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  Core
                </div>
                <div className="space-y-1">
                  <SideLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active />
                  <SideLink icon={<Ticket className="w-4 h-4" />} label="Tickets" />
                  <SideLink icon={<Users className="w-4 h-4" />} label="Customers" />
                  <SideLink icon={<Smartphone className="w-4 h-4" />} label="Devices" />
                  <SideLink icon={<Boxes className="w-4 h-4" />} label="Inventory" />
                </div>
              </div>

              <div>
                <div className="hidden lg:block px-2 text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  Money
                </div>
                <div className="space-y-1">
                  <SideLink icon={<FileText className="w-4 h-4" />} label="Invoices" />
                  <SideLink icon={<CreditCard className="w-4 h-4" />} label="Payments" />
                  <SideLink icon={<Wallet className="w-4 h-4" />} label="Payouts" />
                </div>
              </div>

              <div>
                <div className="hidden lg:block px-2 text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                  Intelligence
                </div>
                <div className="space-y-1">
                  <SideLink icon={<BarChart3 className="w-4 h-4" />} label="Insights" />
                </div>
              </div>
            </nav>

            {/* Shop switcher */}
            <div className="p-3 lg:p-4 border-t border-slate-200/70">
              <div className="hidden lg:block text-[11px] uppercase tracking-wide text-slate-500 mb-2">
                Current shop
              </div>
              <button className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:border-[#8B7CF6]/30 transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">Demo Shop</div>
                    <div className="text-xs text-slate-500 truncate">Austin, TX • Pro plan</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-h-screen">
          {/* TOPBAR / COMMAND BAR */}
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
            <div className="px-4 lg:px-8 py-3 flex items-center gap-3">
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">Dashboard</span>
                <span className="text-slate-300">•</span>
                <span>Demo Shop</span>
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ticket #, phone, IMEI, device…"
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 pl-9 pr-20 py-2.5 text-sm outline-none focus:border-[#8B7CF6]/45 focus:ring-2 focus:ring-[#8B7CF6]/15"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-500">
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1">
                      <Command className="w-3 h-3" /> K
                    </span>
                  </div>
                </div>
              </div>

              {/* Role pills */}
              <div className="hidden lg:flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1 py-1">
                <RolePill label="Front Desk" active={role === 'FRONT_DESK'} onClick={() => setRole('FRONT_DESK')} />
                <RolePill label="Tech" active={role === 'TECH'} onClick={() => setRole('TECH')} />
                <RolePill label="Owner" active={role === 'OWNER'} onClick={() => setRole('OWNER')} />
              </div>

              {/* Actions */}
              <button className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-[#8B7CF6]/25 bg-[#8B7CF6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7A6AF0] transition">
                <Plus className="w-4 h-4" /> New
              </button>

              <button className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white w-10 h-10 hover:border-[#8B7CF6]/30 transition">
                <Bell className="w-4 h-4 text-slate-600" />
              </button>

              <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:border-[#8B7CF6]/30 transition">
                <div className="h-8 w-8 rounded-xl bg-[#8B7CF6]/15 border border-[#8B7CF6]/20 flex items-center justify-center text-xs font-bold text-[#6F5CF6]">
                  DU
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold leading-tight">Demo User</div>
                  <div className="text-xs text-slate-500 leading-tight">{role === 'OWNER' ? 'Owner' : role === 'TECH' ? 'Tech' : 'Front Desk'}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="px-4 lg:px-8 py-6">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Today at Demo Shop</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Calm command center. See the queue first, then act.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-[#8B7CF6]/25 bg-[#8B7CF6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7A6AF0] transition">
                Create Ticket <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Stats (pills, not loud cards) */}
            <div className="grid gap-3 mt-5 md:grid-cols-3">
              <StatPill icon={<Ticket className="w-4 h-4 text-slate-700" />} label="Active" value={`${activeCount}`} sub="In progress today" />
              <StatPill icon={<Flame className="w-4 h-4 text-amber-700" />} label="At risk" value={`${atRiskCount}`} sub="Needs attention" tone="warn" />
              <StatPill icon={<CreditCard className="w-4 h-4 text-slate-700" />} label="Open revenue" value={money(openRevenue)} sub="Work value in queue" />
            </div>

            {/* Main grid: Timeline / Workbench / Money+Comms */}
            <div className="grid gap-4 mt-5 xl:grid-cols-[1.2fr_1.4fr_1fr]">
              {/* TIMELINE */}
              <section className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-md overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Timeline</div>
                    <div className="text-xs text-slate-500">Overdue → Due soon → Normal</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <Chip muted>Today</Chip>
                    <Chip muted>Overdue</Chip>
                    <Chip muted>Upcoming</Chip>
                  </div>
                </div>
                <div className="divide-y divide-slate-200/70">
                  {renderGroup('Overdue', grouped.overdue, setSelectedId)}
                  {renderGroup('Due soon', grouped.soon, setSelectedId)}
                  {renderGroup('Normal', grouped.normal, setSelectedId)}
                </div>
              </section>

              {/* WORKBENCH */}
              <section className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md p-5 space-y-4">
                <SectionTitle title="Workbench" hint="Current ticket focus." />
                {selected ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EDE9FE] to-white flex items-center justify-center text-sm font-semibold text-[#6F5CF6]">
                        {selected.device.split(' ')[0]}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-lg font-semibold text-slate-900">{selected.customer}</div>
                          <Chip muted>{selected.device}</Chip>
                          <Chip muted>{selected.stage}</Chip>
                        </div>
                        <div className="text-sm text-slate-600">Issue: {selected.issue}</div>
                        <div className="text-sm text-slate-500">Tech {selected.tech} • {selected.due}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <SoftButton tone="outline">Continue Intake</SoftButton>
                      <SoftButton tone="outline">Mark Ready</SoftButton>
                      <SoftButton tone="primary">Take Payment</SoftButton>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900">Next steps</div>
                      <ul className="space-y-1 text-sm text-slate-600">
                        <li>• Confirm parts arrival</li>
                        <li>• Capture final diagnostics note</li>
                        <li>• Prepare payment summary</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-sm font-semibold text-slate-900 mb-1">Latest note</div>
                      <div className="text-sm text-slate-600">“Customer approved estimate, wants ready by tonight.”</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Select a ticket in the timeline.</div>
                )}
              </section>

              {/* MONEY + COMMS */}
              <aside className="space-y-4">
                <section className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md p-5">
                  <SectionTitle title="Payment snapshot" />
                  <div className="space-y-1 mt-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Open revenue</span>
                      <span className="font-semibold">{money(openRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Deposit paid</span>
                      <span className="font-semibold text-slate-600">{money(openRevenue * 0.15)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Remaining</span>
                      <span className="font-semibold text-slate-900">{money(openRevenue * 0.85)}</span>
                    </div>
                  </div>
                  <SoftButton className="w-full mt-3" tone="primary">
                    Open Checkout
                  </SoftButton>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md p-5">
                  <SectionTitle title="Customer comms" />
                  <div className="mt-2 space-y-2">
                    <textarea
                      className="w-full min-h-[90px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#8B7CF6]/45 focus:ring-2 focus:ring-[#8B7CF6]/15"
                      placeholder="Type a quick update to the customer…"
                    />
                    <div className="flex items-center gap-2">
                      <SoftButton tone="outline" className="flex-1">
                        <MessageCircle className="w-4 h-4" /> Send update
                      </SoftButton>
                      <SoftButton tone="primary" className="flex-1">
                        Request approval
                      </SoftButton>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-md p-5">
                  <SectionTitle title="Signals" />
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
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
          ? 'bg-[#8B7CF6]/10 border-[#8B7CF6]/20 text-slate-900'
          : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200'
      )}
    >
      <div className={cn('h-9 w-9 rounded-2xl flex items-center justify-center border', active ? 'bg-white border-[#8B7CF6]/20' : 'bg-white border-slate-200')}>
        <div className={cn(active ? 'text-[#6F5CF6]' : 'text-slate-600')}>{icon}</div>
      </div>
      <div className="hidden lg:block text-sm font-semibold">{label}</div>
    </button>
  )
}

function RolePill({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-2xl text-sm font-semibold transition',
        active ? 'bg-[#8B7CF6] text-white' : 'text-slate-600 hover:bg-slate-50'
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
      ? 'bg-rose-50 border-rose-200 text-rose-700'
      : tone === 'warn'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-slate-50 border-slate-200 text-slate-700'

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
      <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1">{label}</div>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="w-full text-left px-3 py-2 rounded-2xl hover:bg-[#8B7CF6]/[0.05] transition flex items-start justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{t.id}</span>
              <StagePill stage={t.stage} />
            </div>
            <div className="text-sm text-slate-700 truncate">
              {t.customer} • {t.device}
            </div>
            <div className="text-xs text-slate-500">{t.due}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
        </button>
      ))}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { mockTickets } from '@/lib/mock/data'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Clock, Ticket, TrendingUp, AlertTriangle, ArrowRight, AlertOctagon, MessageSquare, Info } from 'lucide-react'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'
import { theme } from '@/lib/theme/tokens'
import { CommandBar } from '@/components/workspace/command-bar'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function DashboardClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [])

  const stats = useMemo(() => {
    const active = mockTickets.filter((t) => t.status !== 'PICKED_UP')
    const pastPromised = active.filter((t) => hoursFromNow(t.promisedAt) < 0).length
    const flagged = active.filter((t) => t.risk !== 'none').length
    const estRevenue = active.reduce((sum, t) => sum + t.price, 0)
    return { active: active.length, pastPromised, flagged, estRevenue }
  }, [])

  return (
    <div className="space-y-5 text-[#374151] bg-[#f8f9fa]">
      <CommandBar roleLabel="Owner" shopName="Demo Shop" />

      <PageHeader
        title="Today at Demo Shop"
        description="A calm command center — see the queue first, then act."
        action={
          <Link href="/tickets/new">
            <ButtonPrimary>
              Create Ticket
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </ButtonPrimary>
          </Link>
        }
        className="text-[#111827]"
      />

      {/* Context strip */}
      <GlassCard className="p-4 rounded-[12px] bg-white border border-[#e5e7eb] shadow-sm">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <ContextChip icon={<Ticket className="w-4 h-4" />} label="Active" value={stats.active} />
            <ContextChip icon={<AlertTriangle className="w-4 h-4" />} label="At risk" value={stats.flagged} tone="warn" />
            <ContextChip icon={<TrendingUp className="w-4 h-4" />} label="Open revenue" value={fmtMoney(stats.estRevenue)} />
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Primary: Today queue */}
            <GlassCard className="p-0 rounded-[14px] border border-[#e5e7eb] shadow-sm bg-white">
          <div className="px-6 py-5 flex items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white">
            <div>
              <div className="text-sm font-semibold text-[#111827]">Today’s queue</div>
              <div className="text-xs text-[#5e5e7a] mt-1">Task-like rows. Open to act.</div>
            </div>
            <Link href="/tickets">
              <ButtonSecondary className="px-3 py-2 text-xs rounded-[10px]">View all</ButtonSecondary>
            </Link>
          </div>

          <div className="divide-y divide-[#e5e7eb] bg-white">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-[68px] rounded-2xl" />
                <Skeleton className="h-[68px] rounded-2xl" />
                <Skeleton className="h-[68px] rounded-2xl" />
              </div>
            ) : (
              mockTickets.slice(0, 7).map((t) => {
                const hrs = hoursFromNow(t.promisedAt)
                const promisedLabel = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
                const promisedColor = hrs >= 0 ? theme.colors.muted : 'rgba(248,113,113,0.9)'
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/tickets/${t.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-[rgba(139,124,246,0.06)] transition flex items-center gap-4 bg-white"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#111827]">
                          {t.ticketNumber}
                        </span>
                        <StatusBadge status={t.status} />
                        <span className="text-xs font-semibold" style={{ color: promisedColor }}>
                          {hrs >= 0 ? 'Due ' : 'Overdue '}
                          {promisedLabel}
                        </span>
                      </div>
                      <div className="text-sm truncate" style={{ color: theme.colors.muted }}>
                        {t.customerName} • {t.device}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.muted }}>
                        {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                        <span>Price {fmtMoney(t.price)}</span>
                        {t.assignedTo ? <span>• Tech {t.assignedTo}</span> : null}
                      </div>
                    </div>
                    <div className="text-xs text-white/55 flex items-center gap-1">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </GlassCard>

        {/* Side rail */}
        <div className="space-y-4">
          <GlassCard className="p-5 rounded-[14px] space-y-3 bg-white border border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-300" />
              <div className="text-sm font-semibold text-[#111827]">Signals</div>
            </div>
            {loading ? (
              <Skeleton className="h-14 rounded-xl" />
            ) : (
              <div className="space-y-2 text-sm text-[#5e5e7a]">
                <div className="flex items-center justify-between rounded-[10px] bg-[#F7F6FB] border border-[rgba(30,30,60,0.08)] px-3 py-2">
                  <span>At risk</span>
                  <span className="text-[#C47A00] font-semibold">{stats.flagged}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F7F6FB] border border-[rgba(30,30,60,0.08)] px-3 py-2">
                  <span>Overdue</span>
                  <span className="text-[#C63939] font-semibold">{stats.pastPromised}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F7F6FB] border border-[rgba(30,30,60,0.08)] px-3 py-2">
                  <span>Open revenue</span>
                  <span className="text-[#1F1E2E] font-semibold">{fmtMoney(stats.estRevenue)}</span>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 rounded-[14px] space-y-3 bg-white border border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-200" />
              <div className="text-sm font-semibold text-[#111827]">Quick intake</div>
            </div>
            {loading ? (
              <Skeleton className="h-[140px] rounded-2xl" />
            ) : (
              <>
                <textarea
                  className="w-full rounded-[12px] bg-white border border-[rgba(30,30,60,0.08)] p-4 text-sm text-[#1F1E2E] placeholder:text-[#8C8AA3] focus:outline-none focus:ring-2 focus:ring-[rgba(139,124,246,0.35)] min-h-[120px]"
                  placeholder='e.g., "Jordan 5125550142 iPhone 14 Pro cracked screen same-day."'
                />
                <div className="flex items-center gap-2">
                  <Link href="/tickets/new">
                    <ButtonPrimary className="px-4 py-2 text-sm rounded-[10px]">Start intake</ButtonPrimary>
                  </Link>
                  <ButtonSecondary className="px-3 py-2 text-xs rounded-[10px]">Save note</ButtonSecondary>
                </div>
              </>
            )}
          </GlassCard>

          <GlassCard className="p-5 rounded-[14px] space-y-3 bg-white border border-[#e5e7eb]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white/65" />
              <div className="text-sm font-semibold text-[#111827]">Tips</div>
            </div>
            <ul className="space-y-2 text-sm text-[#5e5e7a]">
              <li>Finish overdue tickets before new work.</li>
              <li>Always confirm promised time at intake.</li>
              <li>Keep payment ready — speed builds trust.</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function ContextChip({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone?: 'neutral' | 'warn'
}) {
  const colors = tone === 'warn' ? { bg: 'rgba(251,191,36,0.12)', text: 'rgba(255,241,207,0.95)' } : { bg: 'rgba(255,255,255,0.04)', text: theme.colors.text }
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2 border"
      style={{ background: colors.bg, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="text-white/70">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-[0.08em] text-white/45 font-semibold">{label}</div>
        <div className="text-sm font-semibold" style={{ color: colors.text }}>{value}</div>
      </div>
    </div>
  )
}



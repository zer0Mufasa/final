'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { mockTickets } from '@/lib/mock/data'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { StatCard } from '@/components/dashboard/ui/stat-card'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Clock, Ticket, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'

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
    <div>
      <PageHeader
        title="Dashboard"
        description="A calm command center for today’s repairs — fast intake, clear next steps, and risk signals when they matter."
        action={
          <Link href="/tickets/new">
            <Button rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}>
              Create Ticket
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-[110px] rounded-3xl" />
            <Skeleton className="h-[110px] rounded-3xl" />
            <Skeleton className="h-[110px] rounded-3xl" />
            <Skeleton className="h-[110px] rounded-3xl" />
          </>
        ) : (
          <>
            <StatCard label="Active tickets" value={String(stats.active)} hint="In progress today" icon={<Ticket className="w-5 h-5" />} />
            <StatCard label="Past promised" value={String(stats.pastPromised)} hint="Needs attention" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Risk flags" value={String(stats.flagged)} hint="Review before work" icon={<AlertTriangle className="w-5 h-5" />} />
            <StatCard label="Est. revenue" value={fmtMoney(stats.estRevenue)} hint="Open work value" icon={<TrendingUp className="w-5 h-5" />} />
          </>
        )}
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-3">
        {/* Today queue */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden rounded-3xl">
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Today’s queue</div>
              <div className="text-xs text-white/50 mt-1">Quick-glance list — open, message, or push to next stage.</div>
            </div>
            <Link href="/tickets" className="btn-secondary px-4 py-2 text-sm rounded-xl">
              View all
            </Link>
          </div>

          <div className="p-3">
            {loading ? (
              <div className="space-y-3 p-3">
                <Skeleton className="h-[72px] rounded-2xl" />
                <Skeleton className="h-[72px] rounded-2xl" />
                <Skeleton className="h-[72px] rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-2">
                {mockTickets.slice(0, 6).map((t) => {
                  const hrs = hoursFromNow(t.promisedAt)
                  const promisedLabel = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
                  const promisedCls = hrs >= 0 ? 'text-white/55' : 'text-red-300'
                  return (
                    <div
                      key={t.id}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                      className="rounded-2xl bg-white/[0.035] border border-white/10 hover:bg-white/[0.055] transition-colors px-4 py-3 flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-white/90 truncate">{t.ticketNumber}</div>
                          <StatusBadge status={t.status} />
                          <span className={`text-xs font-semibold ${promisedCls}`}>Promised {promisedLabel}</span>
                        </div>
                        <div className="text-sm text-white/70 mt-1 truncate">{t.customerName} • {t.device}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                          <span className="text-xs text-white/45">Price {fmtMoney(t.price)}</span>
                          {t.assignedTo ? <span className="text-xs text-white/45">• Tech {t.assignedTo}</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-ghost px-3 py-2 text-xs rounded-xl">Message</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Quick intake */}
        <GlassCard className="p-6 rounded-3xl">
          <div className="text-sm font-semibold text-white/90">Quick intake</div>
          <div className="text-xs text-white/50 mt-1 leading-relaxed">
            Type a sentence, paste a message, or jot the essentials — we’ll wire generation later. For now, this helps front-desk move fast.
          </div>

          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[160px] rounded-2xl" />
            ) : (
              <>
                <textarea
                  className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[160px]"
                  placeholder="e.g., “iPhone 14 Pro — cracked screen, customer says it still turns on. Wants same-day if possible.”"
                />
                <div className="mt-3 flex items-center gap-2">
                  <Link href="/tickets/new" className="btn-primary px-4 py-2.5 text-sm rounded-xl">
                    Start intake
                  </Link>
                  <button className="btn-secondary px-4 py-2.5 text-sm rounded-xl">
                    Pretend-generate fields
                  </button>
                </div>
                <div className="mt-3 text-xs text-white/45">
                  Tip: keep it short — customer name + device + problem + deadline.
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}



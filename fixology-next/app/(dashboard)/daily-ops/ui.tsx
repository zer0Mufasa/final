'use client'

// app/(dashboard)/daily-ops/ui.tsx
// Morning operational overview - calm, factual, no hype

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { QueuePressureMeter, TechLoadRing, TimeToPromiseBar, BottleneckDetector } from '@/components/dashboard/ui/workload-widgets'
import { mockTickets, mockTechs } from '@/lib/mock/data'
import { Clock, Package, AlertTriangle, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function DailyOpsClient() {
  const activeTickets = mockTickets.filter((t) => t.status !== 'PICKED_UP')
  const atRisk = activeTickets.filter((t) => {
    const hrs = hoursFromNow(t.promisedAt)
    return hrs >= 0 && hrs <= 4
  })

  return (
    <div>
      <PageHeader
        title="To Do"
        description="Morning overview — commitments, risks, workload, and bottlenecks. Calm and factual."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's commitments */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Today's commitments</div>
            </div>
            <div className="space-y-3">
              {activeTickets.slice(0, 5).map((t) => {
                const hrs = hoursFromNow(t.promisedAt)
                const label = hrs >= 0 ? `in ${hrs}h` : `${Math.abs(hrs)}h late`
                return (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <div className="text-sm font-semibold text-white/90">{t.ticketNumber}</div>
                          <StatusBadge status={t.status} />
                          {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                        </div>
                        <div className="text-sm text-white/70">{t.customerName} • {t.device}</div>
                      </div>
                      <div className={cn('text-sm font-semibold', hrs < 0 ? 'text-red-300' : 'text-white/60')}>
                        {label}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </GlassCard>

          {/* Tickets likely to miss promise */}
          {atRisk.length > 0 && (
            <GlassCard className="p-6 rounded-3xl border-yellow-400/30 bg-yellow-500/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
                <div className="text-sm font-semibold text-white/90">Tickets likely to miss promise time</div>
              </div>
              <div className="space-y-2">
                {atRisk.slice(0, 3).map((t) => {
                  const hrs = hoursFromNow(t.promisedAt)
                  return (
                    <div key={t.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                      <div className="text-sm font-semibold text-white/90">{t.ticketNumber}</div>
                      <div className="text-xs text-white/60 mt-1">
                        Promised in {hrs}h • {t.assignedTo || 'Unassigned'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Bottleneck warnings */}
          <BottleneckDetector
            bottlenecks={[
              { type: 'parts', count: 5, message: 'Most tickets are waiting on parts — consider bulk ordering.' },
            ]}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Staff workload */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Staff workload</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mockTechs.slice(0, 4).map((tech, i) => (
                <TechLoadRing key={tech} name={tech} assigned={i + 2} max={5} color={i % 2 === 0 ? 'purple' : 'blue'} />
              ))}
            </div>
          </GlassCard>

          {/* Queue pressure */}
          <QueuePressureMeter current={activeTickets.length} capacity={25} label="Queue pressure" />

          {/* Time to promise */}
          <TimeToPromiseBar tickets={activeTickets} />

          {/* Parts arriving */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Parts arriving today</div>
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <div>iPhone 14 Pro Screen (x3) — 2:00 PM</div>
              <div>Samsung S23 Battery (x2) — 3:30 PM</div>
              <div className="text-xs text-white/50 mt-2">UI only — will sync with suppliers</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


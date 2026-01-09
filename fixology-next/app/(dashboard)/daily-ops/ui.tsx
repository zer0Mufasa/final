'use client'

// app/(dashboard)/daily-ops/ui.tsx
// Morning operational overview - calm, factual, no hype

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { QueuePressureMeter, TechLoadRing, TimeToPromiseBar, BottleneckDetector } from '@/components/dashboard/ui/workload-widgets'
import { Clock, Package, AlertTriangle, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useEffect, useMemo, useState } from 'react'

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function DailyOpsClient() {
  const [tickets, setTickets] = useState<any[]>([])
  const [staff, setStaff] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const [tRes, sRes] = await Promise.all([
          fetch('/api/tickets?limit=100', { cache: 'no-store' }),
          fetch('/api/staff', { cache: 'no-store' }),
        ])
        const tJson = await tRes.json().catch(() => ({}))
        const sJson = await sRes.json().catch(() => ({}))
        if (!cancelled) {
          const mappedTickets = Array.isArray(tJson?.tickets) ? tJson.tickets : []
          const mappedStaff = Array.isArray(sJson) ? sJson.map((s: any) => s.name || s.email).filter(Boolean) : []
          setTickets(mappedTickets)
          setStaff(mappedStaff)
        }
      } catch (e) {
        if (!cancelled) {
          setTickets([])
          setStaff([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeTickets = useMemo(() => {
    return tickets.filter((t) => {
      const status = String(t.status || '').toUpperCase()
      return !['READY', 'PICKED_UP', 'CANCELLED', 'COMPLETE'].includes(status)
    })
  }, [tickets])

  const atRisk = useMemo(() => {
    return activeTickets.filter((t) => {
      const promised = t.dueAt || t.promisedAt || t.createdAt
      if (!promised) return false
      const hrs = hoursFromNow(promised)
      return hrs >= 0 && hrs <= 4
    })
  }, [activeTickets])

  const waitingPartsCount = useMemo(() => {
    return tickets.filter((t) => String(t.status || '').toUpperCase() === 'WAITING_PARTS').length
  }, [tickets])

  const staffLoad = useMemo(() => {
    const counts: Record<string, number> = {}
    activeTickets.forEach((t) => {
      const name = t.assignedTo?.name || t.assignedTo || 'Unassigned'
      counts[name] = (counts[name] || 0) + 1
    })
    const entries = Object.entries(counts)
    // ensure staff list present
    staff.forEach((s) => {
      if (!counts[s]) entries.push([s, 0])
    })
    return entries.slice(0, 6)
  }, [activeTickets, staff])

  return (
    <div className="px-4 py-5 sm:p-6 space-y-6">
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
              <Clock className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Today's commitments</div>
            </div>
            <div className="space-y-3">
              {activeTickets.slice(0, 5).map((t) => {
                const promised = t.dueAt || t.promisedAt || t.createdAt
                const hrs = promised ? hoursFromNow(promised) : 0
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
                          <div className="text-sm font-semibold text-[var(--text-primary)]">{t.ticketNumber}</div>
                          <StatusBadge status={t.status} />
                          {t.risk !== 'none' && <RiskBadge risk={t.risk} />}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">{(t.customer?.name || t.customerName || 'Customer')} • {(t.deviceBrand || '')} {(t.deviceModel || t.device || '')}</div>
                      </div>
                      <div className={cn('text-sm font-semibold', hrs < 0 ? 'text-red-300' : 'text-[var(--text-primary)]/60')}>
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
                <div className="text-sm font-semibold text-[var(--text-primary)]">Tickets likely to miss promise time</div>
              </div>
              <div className="space-y-2">
                {atRisk.slice(0, 3).map((t) => {
                  const promised = t.dueAt || t.promisedAt || t.createdAt
                  const hrs = promised ? hoursFromNow(promised) : 0
                  return (
                    <div key={t.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{t.ticketNumber}</div>
                      <div className="text-xs text-[var(--text-primary)]/60 mt-1">
                        Promised in {hrs}h • {t.assignedTo?.name || t.assignedTo || 'Unassigned'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Bottleneck warnings */}
          <BottleneckDetector
            bottlenecks={
              waitingPartsCount > 0
                ? [{ type: 'parts', count: waitingPartsCount, message: `${waitingPartsCount} ticket(s) waiting on parts.` }]
                : []
            }
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Staff workload */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Staff workload</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {staffLoad.length === 0 && (
                <div className="text-sm text-white/50">No staff data.</div>
              )}
              {staffLoad.map(([name, count], i) => (
                <TechLoadRing key={name} name={name} assigned={count} max={5} color={i % 2 === 0 ? 'purple' : 'blue'} />
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
              <Package className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Parts arriving today</div>
            </div>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <div>iPhone 14 Pro Screen (x3) — 2:00 PM</div>
              <div>Samsung S23 Battery (x2) — 3:30 PM</div>
              <div className="text-xs text-[var(--text-muted)] mt-2">UI only — will sync with suppliers</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


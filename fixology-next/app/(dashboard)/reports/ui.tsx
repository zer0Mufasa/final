'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatCard } from '@/components/dashboard/ui/stat-card'
import { ArrowRight, BarChart3, Clock, Package, Ticket, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function ReportsClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    }, 650)
    return () => clearTimeout(t)
  }, [])

  const ticketVolume = useMemo(
    () => [
      { day: 'Mon', tickets: 14 },
      { day: 'Tue', tickets: 18 },
      { day: 'Wed', tickets: 11 },
      { day: 'Thu', tickets: 22 },
      { day: 'Fri', tickets: 19 },
      { day: 'Sat', tickets: 9 },
      { day: 'Sun', tickets: 6 },
    ],
    []
  )

  const turnaround = useMemo(
    () => [
      { bucket: '<2h', count: 12 },
      { bucket: '2–4h', count: 18 },
      { bucket: '4–8h', count: 9 },
      { bucket: '8–24h', count: 7 },
      { bucket: '1–3d', count: 3 },
    ],
    []
  )

  const topRepairs = useMemo(
    () => [
      { name: 'Screens', value: 44, fill: 'rgba(167,139,250,0.85)' },
      { name: 'Batteries', value: 21, fill: 'rgba(74,222,128,0.75)' },
      { name: 'Ports', value: 16, fill: 'rgba(56,189,248,0.70)' },
      { name: 'Other', value: 19, fill: 'rgba(251,191,36,0.70)' },
    ],
    []
  )

  const partsUsage = useMemo(
    () => [
      { part: 'iPhone 14 Pro Screen', used: 8 },
      { part: 'Adhesive kit', used: 34 },
      { part: 'S23 Ultra Battery', used: 6 },
      { part: 'USB‑C Port', used: 4 },
      { part: 'Camera lens', used: 7 },
    ],
    []
  )

  const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ')

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Reports"
          description="High-signal analytics for a busy shop: volume, turnaround, top repairs, and parts usage. (Mocked data for now.)"
          action={
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
              Export (UI)
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          }
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <Skeleton className="h-[110px] rounded-3xl" />
          <Skeleton className="h-[110px] rounded-3xl" />
          <Skeleton className="h-[110px] rounded-3xl" />
          <Skeleton className="h-[110px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[320px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Tickets this week" value="99" hint="+12% WoW" icon={<Ticket className="w-5 h-5" />} />
            <StatCard label="Avg turnaround" value="4.1h" hint="Target < 5h" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Customers served" value="61" hint="Repeat rate 42%" icon={<Users className="w-5 h-5" />} />
            <StatCard label="Parts used" value="59" hint="Low stock 3 items" icon={<Package className="w-5 h-5" />} />
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-4">
            <GlassCard className="rounded-3xl lg:col-span-2 p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Ticket volume</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Daily tickets — keep intake predictable.</div>
                </div>
                <div className="badge bg-white/5 text-[var(--text-primary)]/55 border border-[var(--border-default)]">Last 7 days</div>
              </div>
              <div className="h-[300px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketVolume} margin={{ left: 8, right: 20, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(167,139,250,0.65)" />
                        <stop offset="100%" stopColor="rgba(167,139,250,0.05)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, color: 'white' }} />
                    <Area type="monotone" dataKey="tickets" stroke="rgba(167,139,250,0.9)" fill="url(#volGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border-default)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Average turnaround</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">How fast repairs finish.</div>
              </div>
              <div className="h-[300px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnaround} margin={{ left: 12, right: 14, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="bucket" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, color: 'white' }} />
                    <Bar dataKey="count" fill="rgba(74,222,128,0.55)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border-default)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Top repairs</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Where revenue concentrates.</div>
              </div>
              <div className="h-[300px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, color: 'white' }} />
                    <Pie data={topRepairs} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={4} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-4 mt-4 lg:grid-cols-4">
            <GlassCard className="rounded-3xl lg:col-span-4 p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Parts usage</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Most used parts — keep these stocked.</div>
                </div>
                <div className="badge bg-white/5 text-[var(--text-primary)]/55 border border-[var(--border-default)]">Mocked</div>
              </div>
              <div className="h-[280px] px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partsUsage} margin={{ left: 14, right: 14, top: 10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="part" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(10,10,15,0.85)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, color: 'white' }} />
                    <Bar dataKey="used" fill="rgba(56,189,248,0.55)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  )
}



'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from '@/components/ui/toaster'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Modal } from '@/components/dashboard/ui/modal'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  Clock,
  Play,
  Square,
  Plus,
  Calendar,
  User,
  Ticket,
  Timer,
  TrendingUp,
  Coffee,
  ArrowUpRight,
  ChevronRight,
  Search,
  Download,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TimeEntry = {
  id: string
  tech: string
  techInitials: string
  ticket: string
  device: string
  start: string
  end: string | null
  duration: string
  type: 'repair' | 'break' | 'admin'
  status: 'active' | 'completed'
}

type ActivityEvent = {
  id: string
  userId: string
  userName?: string
  type: 'shop_open' | 'shop_close' | 'clock_in' | 'clock_out'
  timestamp: string
}

const techStats = [
  { name: 'Ava', hours: 6.2, repairs: 4, color: '#a78bfa' },
  { name: 'Noah', hours: 5.8, repairs: 3, color: '#22c55e' },
  { name: 'Miles', hours: 4.5, repairs: 3, color: '#38bdf8' },
  { name: 'Sofia', hours: 5.0, repairs: 2, color: '#fbbf24' },
]

const weeklyHours = [
  { day: 'Mon', hours: 28 },
  { day: 'Tue', hours: 32 },
  { day: 'Wed', hours: 26 },
  { day: 'Thu', hours: 35 },
  { day: 'Fri', hours: 30 },
  { day: 'Sat', hours: 18 },
  { day: 'Sun', hours: 0 },
]

export function TimeTrackingPage() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [tab, setTab] = useState<'today' | 'week' | 'all'>('today')
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [summary, setSummary] = useState({ totalHoursToday: 0, activeTimers: 0, avgMinutesPerEntryToday: 0 })
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/time-tracking')
      if (!res.ok) {
        setEntries([])
        setSummary({ totalHoursToday: 0, activeTimers: 0, avgMinutesPerEntryToday: 0 })
        return
      }
      const data = await res.json()
      const mapped: TimeEntry[] = Array.isArray(data.entries)
        ? data.entries.map((e: any) => ({
            id: e.id,
            tech: e.userName,
            techInitials: String(e.userName || 'U')
              .split(' ')
              .filter(Boolean)
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            ticket: '—',
            device: '—',
            start: new Date(e.clockIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            end: e.clockOut
              ? new Date(e.clockOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
              : null,
            duration:
              typeof e.durationMinutes === 'number'
                ? `${Math.floor(e.durationMinutes / 60)}h ${e.durationMinutes % 60}m`
                : 'Running',
            type: 'repair' as const,
            status: e.status as any,
          }))
        : []
      setEntries(mapped)
      setSummary({
        totalHoursToday: Number(data?.summary?.totalHoursToday ?? 0),
        activeTimers: Number(data?.summary?.activeTimers ?? 0),
        avgMinutesPerEntryToday: Number(data?.summary?.avgMinutesPerEntryToday ?? 0),
      })
    } catch {
      setEntries([])
      setSummary({ totalHoursToday: 0, activeTimers: 0, avgMinutesPerEntryToday: 0 })
    }
  }, [])

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity')
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.events)) {
        setActivity(data.events)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchEntries(), fetchActivity()]).then(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    })
  }, [fetchEntries, fetchActivity])

  const handleAddEntry = async (clockIn: string, clockOut?: string) => {
    try {
      const res = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockIn, clockOut }),
      })
      if (!res.ok) {
        toast.error('Failed to add entry')
        return
      }
      toast.success('Time entry added')
      setAddOpen(false)
      fetchEntries()
    } catch {
      toast.error('Failed to add entry')
    }
  }

  const handleExport = () => {
    toast.success('Export started - file will download shortly')
  }

  const filteredSessions = useMemo(() => {
    let result = entries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((s) =>
        s.tech.toLowerCase().includes(q) ||
        s.ticket.toLowerCase().includes(q) ||
        s.device.toLowerCase().includes(q)
      )
    }
    return result
  }, [searchQuery, entries])

  const summaryStats = useMemo(
    () => [
      { label: 'Total Hours Today', value: `${summary.totalHoursToday}h`, icon: <Clock className="w-5 h-5" />, color: 'purple' },
      { label: 'Active Timers', value: String(summary.activeTimers), icon: <PlayCircle className="w-5 h-5" />, color: 'emerald' },
      { label: 'Avg Session (today)', value: summary.avgMinutesPerEntryToday ? `${summary.avgMinutesPerEntryToday}m` : '—', icon: <Timer className="w-5 h-5" />, color: 'blue' },
      { label: 'Break Time', value: '—', icon: <Coffee className="w-5 h-5" />, color: 'amber' },
    ],
    [summary.activeTimers, summary.avgMinutesPerEntryToday, summary.totalHoursToday]
  )

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'repair':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'break':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'admin':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      default:
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Time Tracking" description="Loading..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Time Tracking"
          description="Track technician hours, repair sessions, and productivity metrics."
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className={cn(
                  "px-4 py-2.5 rounded-xl inline-flex items-center gap-2",
                  "text-sm font-medium text-[var(--text-secondary)]",
                  "bg-white/[0.04] border border-white/10",
                  "transition-all duration-200 hover:bg-white/[0.08] hover:border-white/20"
                )}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className={cn(
                  "group relative px-5 py-2.5 rounded-xl inline-flex items-center gap-2",
                  "text-sm font-semibold text-white",
                  "transition-all duration-300 ease-out",
                  "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                )}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          }
        />
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {summaryStats.map((stat) => (
          <GlassCard
            key={stat.label}
            className={cn(
              'p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group',
              stat.color === 'purple' && 'border-purple-500/20',
              stat.color === 'emerald' && 'border-emerald-500/20',
              stat.color === 'blue' && 'border-blue-500/20',
              stat.color === 'amber' && 'border-amber-500/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'p-2.5 rounded-xl',
                  stat.color === 'purple' && 'bg-purple-500/15 text-purple-400',
                  stat.color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                  stat.color === 'blue' && 'bg-blue-500/15 text-blue-400',
                  stat.color === 'amber' && 'bg-amber-500/15 text-amber-400'
                )}
              >
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-3">{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Time Entries Table */}
        <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-[var(--border-default)]">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as any)}
              tabs={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'all', label: 'All Time' },
              ]}
            />
          </div>

          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Search by tech, ticket, device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <Calendar className="w-4 h-4" /> Date
              </button>
              <button className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <User className="w-4 h-4" /> Tech
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)] border-b border-white/[0.06]">
                  <th className="px-5 py-3">Technician</th>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                      No time entries yet. Clock in from the dashboard to start tracking.
                    </td>
                  </tr>
                )}
                {filteredSessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedEntry(s)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-semibold text-purple-300">
                          {s.techInitials}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{s.tech}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-purple-300">{s.ticket}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[var(--text-secondary)]">{s.device}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-[var(--text-primary)]">{s.start}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {s.end ? `→ ${s.end}` : '(active)'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{s.duration}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize border', getTypeStyles(s.type))}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Weekly Hours Chart */}
          <GlassCard className="rounded-3xl p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Weekly Hours</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Team hours by day</div>
            </div>
            <div className="h-[180px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyHours} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                      color: 'white',
                    }}
                    formatter={(value: number) => [`${value}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="rgba(167,139,250,0.6)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Tech Leaderboard */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Tech Leaderboard</div>
            </div>
            <div className="space-y-3">
              {techStats.map((tech, i) => (
                <div key={tech.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{tech.name}</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{tech.hours}h</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(tech.hours / 8) * 100}%`, backgroundColor: tech.color }}
                      />
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">{tech.repairs} repairs</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-purple-400" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</div>
            </div>
            <div className="space-y-3">
              {activity.slice(0, 8).map((ev) => (
                <div key={ev.id} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-xs font-semibold text-purple-200">
                        {(ev.userName || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {ev.userName || 'User'}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] capitalize">
                          {ev.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-xs text-[var(--text-muted)]">No recent activity yet.</div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add Entry Modal */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Time Entry"
        description="Manually log time for a repair or task."
      >
        <div className="space-y-4">
          <div>
            <label className="label">Technician</label>
            <select className="select bg-[var(--bg-input)] border-[var(--border-default)]">
              <option>Ava Chen</option>
              <option>Noah Smith</option>
              <option>Miles Rodriguez</option>
              <option>Sofia Martinez</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select bg-[var(--bg-input)] border-[var(--border-default)]">
              <option value="repair">Repair</option>
              <option value="break">Break</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input bg-[var(--bg-input)] border-[var(--border-default)]" />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input bg-[var(--bg-input)] border-[var(--border-default)]" />
            </div>
          </div>
          <div>
            <label className="label">Ticket # (optional)</label>
            <input className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="#2381" />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input bg-[var(--bg-input)] border-[var(--border-default)] min-h-[80px]" placeholder="Any additional notes..." />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary px-4 py-3 rounded-xl flex-1" onClick={() => setAddOpen(false)}>
              Add Entry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import {
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorClosed,
  DoorOpen,
  Download,
  Filter,
  Target,
  DollarSign,
  Ticket,
  Coffee,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Types

type TimeEntry = {
  id: string
  odisId: string
  staffName: string
  clockIn: string
  clockOut?: string | null
  breakMinutes: number
  openedShop?: boolean
  closedShop?: boolean
}

type StaffMember = {
  id: string
  name: string
  role: 'owner' | 'manager' | 'technician' | 'front-desk'
}

type DaySchedule = {
  date: Date
  entries: TimeEntry[]
  shopOpener?: string
  shopCloser?: string
  isToday: boolean
  isCurrentMonth: boolean
}

type Summary = {
  revenue?: { total: number; change: number; byDay: { day: string; amount: number }[] }
  tickets?: { completed: number; change: number; byDay: { day: string; count: number }[] }
  hours?: { total: number; avgPerDay: number; byStaff: { staffId: string; staffName: string; hours: number }[] }
  topRepairs?: { name: string; count: number; percentage: number }[]
}

type ActivityEvent = {
  id: string
  type: string
  userId: string
  userName?: string
  timestamp: string
  entryId?: string
}

type EventRow = {
  id: string
  timestamp: string
  type: 'shop_open' | 'shop_close' | 'clock_in' | 'clock_out' | 'note'
  staffName: string
  detail?: string
}

const STAFF_COLORS = [
  { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
]

const cn = (...c: (string | boolean | null | undefined)[]) => c.filter(Boolean).join(' ')
const formatTime = (d: string | Date) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const formatDateFull = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const getHoursWorked = (clockIn: string, clockOut?: string | null, breakMinutes = 0) => {
  if (!clockOut) return null
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime()
  return Math.max(0, ms / 36e5 - breakMinutes / 60)
}

function CalendarDayCell({ day, staff, onSelect, isSelected }: { day: DaySchedule; staff: StaffMember[]; onSelect: (d: DaySchedule) => void; isSelected: boolean }) {
  const staffIdx: Record<string, number> = {}
  staff.forEach((s, i) => (staffIdx[s.id] = i))

  return (
    <button
      onClick={() => onSelect(day)}
      className={cn(
        'relative p-2 rounded-xl transition-all duration-200 min-h-[72px] flex flex-col items-center gap-1 border',
        day.isCurrentMonth ? 'opacity-100' : 'opacity-40',
        day.isToday && 'ring-2 ring-violet-500/50',
        isSelected ? 'bg-violet-500/20 border-violet-500/40 scale-[1.02]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]'
      )}
    >
      <span className={cn('text-sm font-medium', day.isToday ? 'text-violet-400' : 'text-white/70')}>{day.date.getDate()}</span>
      {day.entries.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {day.entries.slice(0, 4).map((e) => {
            const colors = STAFF_COLORS[(staffIdx[e.odisId] ?? 0) % STAFF_COLORS.length]
            return <div key={e.id} className={cn('w-2 h-2 rounded-full', colors.dot)} title={e.staffName} />
          })}
          {day.entries.length > 4 && <span className="text-[10px] text-white/50">+{day.entries.length - 4}</span>}
        </div>
      )}
      {day.shopOpener && (
        <div className="absolute top-0.5 left-0.5">
          <DoorOpen className="w-2.5 h-2.5 text-emerald-400" />
        </div>
      )}
      {day.shopCloser && (
        <div className="absolute top-0.5 right-0.5">
          <DoorClosed className="w-2.5 h-2.5 text-amber-400" />
        </div>
      )}
    </button>
  )
}

function StaffLegend({ staff }: { staff: StaffMember[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {staff.map((s, i) => {
        const colors = STAFF_COLORS[i % STAFF_COLORS.length]
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', colors.dot)} />
            <span className="text-sm text-white/70">{s.name}</span>
          </div>
        )
      })}
    </div>
  )
}

function DayDetailPanel({ day, staff }: { day: DaySchedule | null; staff: StaffMember[] }) {
  if (!day) return null
  const staffIdx: Record<string, number> = {}
  staff.forEach((s, i) => (staffIdx[s.id] = i))
  const totalHours = day.entries.reduce((sum, e) => sum + (getHoursWorked(e.clockIn, e.clockOut, e.breakMinutes) || 0), 0)

  return (
    <div className="rounded-2xl p-5 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white/90">{formatDateFull(day.date)}</h3>
          <p className="text-sm text-white/50">{day.entries.length} staff • {totalHours.toFixed(1)} total hours</p>
        </div>
        {day.isToday && (
          <span className="px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-medium">Today</span>
        )}
      </div>

      {(day.shopOpener || day.shopCloser) && (
        <div className="flex gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          {day.shopOpener && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20">
                <DoorOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Opened by</p>
                <p className="text-sm font-medium text-white/90">{day.shopOpener}</p>
              </div>
            </div>
          )}
          {day.shopCloser && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <DoorClosed className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Closed by</p>
                <p className="text-sm font-medium text-white/90">{day.shopCloser}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {day.entries.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">No one worked this day</p>
        ) : (
          day.entries.map((entry) => {
            const colors = STAFF_COLORS[(staffIdx[entry.odisId] ?? 0) % STAFF_COLORS.length]
            const hours = getHoursWorked(entry.clockIn, entry.clockOut, entry.breakMinutes)
            return (
              <div key={entry.id} className={cn('p-3 rounded-xl border', colors.bg, colors.border)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold', colors.bg, colors.text)}>
                      {entry.staffName.charAt(0)}
                    </div>
                    <div>
                      <p className={cn('font-medium', colors.text)}>{entry.staffName}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>{formatTime(entry.clockIn)}</span>
                        <span>→</span>
                        <span>{entry.clockOut ? formatTime(entry.clockOut) : 'Still working'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold', colors.text)}>{hours ? `${hours.toFixed(1)}h` : '—'}</p>
                    {entry.breakMinutes > 0 && (
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        {entry.breakMinutes}m
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {entry.openedShop && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🔓 Opened</span>
                  )}
                  {entry.closedShop && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">🔐 Closed</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function WeeklyHoursChart({ entries, staff }: { entries: TimeEntry[]; staff: StaffMember[] }) {
  const data = useMemo(() => {
    const now = new Date()
    const out: { name: string; [key: string]: number | string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const row: any = { name: d.toLocaleDateString('en-US', { weekday: 'short' }) }
      staff.forEach((s) => {
        const hrs = entries
          .filter((e) => e.odisId === s.id && e.clockIn.startsWith(dateStr))
          .reduce((sum, e) => sum + (getHoursWorked(e.clockIn, e.clockOut, e.breakMinutes) || 0), 0)
        row[s.name] = Math.round(hrs * 10) / 10
      })
      out.push(row)
    }
    return out
  }, [entries, staff])

  const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#3b82f6']
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v) => `${v}h`} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
          formatter={(value: number) => [`${value}h`, '']}
        />
        {staff.map((s, i) => (
          <Bar key={s.id} dataKey={s.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function RevenueChart({ data }: { data: { day: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
        <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{ background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
          formatter={(v: number) => [`$${v}`, 'Revenue']}
        />
        <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function TopRepairsChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-white/70">{item.name}</span>
            <span className="text-sm font-medium text-white/90">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCardMini({ icon: Icon, label, value, change, positive }: { icon: any; label: string; value: string; change?: string; positive?: boolean }) {
  return (
    <div className="p-4 rounded-2xl border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08] hover:border-white/[0.12] transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        {change && <div className={cn('text-xs font-medium', positive ? 'text-emerald-400' : 'text-rose-400')}>{change}</div>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white/95">{value}</p>
        <p className="text-sm text-white/50">{label}</p>
      </div>
    </div>
  )
}

export function ReportsClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  useEffect(() => {
    async function load() {
      try {
        const sRes = await fetch('/api/staff', { cache: 'no-store' })
        const sJson = await sRes.json()
        const staffList = Array.isArray(sJson) ? sJson : Array.isArray(sJson.staff) ? sJson.staff : []
        setStaff(
          staffList.map((s: any) => ({
            id: s.id,
            name: (typeof s.name === 'string' && s.name.trim()) || s.email || 'Staff',
            role: (s.role || 'technician').toLowerCase(),
          }))
        )

        const tRes = await fetch('/api/time-tracking?range=month', { cache: 'no-store' })
        const tJson = await tRes.json()
        const tEntries = Array.isArray(tJson.entries) ? tJson.entries : []
        setEntries(
          tEntries.map((e: any) => ({
            id: e.id,
            odisId: e.odisId || e.userId,
            staffName: e.staffName || e.userName || 'Staff',
            clockIn: e.clockIn,
            clockOut: e.clockOut,
            breakMinutes: e.breakMinutes || 0,
            openedShop: e.openedShop,
            closedShop: e.closedShop,
          }))
        )

        const [rRes, aRes] = await Promise.all([
          fetch('/api/reports/summary?period=week', { cache: 'no-store' }),
          fetch('/api/activity', { cache: 'no-store' }),
        ])
        const rJson = await rRes.json()
        setSummary(rJson)
        const aJson = await aRes.json()
        setActivity(Array.isArray(aJson?.events) ? aJson.events : [])
      } catch (e) {
        console.error('Reports load error', e)
      } finally {
        setLoading(false)
        setTimeout(() => setAnimationReady(true), 100)
      }
    }
    load()
  }, [])

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const first = new Date(year, month, 1)
    const start = new Date(first)
    start.setDate(start.getDate() - first.getDay())
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: DaySchedule[] = []

    for (let i = 0; i < 42; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const dateStr = date.toISOString().slice(0, 10)
      const dayEntries = entries.filter((e) => e.clockIn.startsWith(dateStr))
      const filtered = selectedStaff ? dayEntries.filter((e) => e.odisId === selectedStaff) : dayEntries
      const openerEntry = dayEntries.find((e) => e.openedShop)
      const closerEntry = dayEntries.find((e) => e.closedShop)
      const dayActs = activity.filter((ev) => ev.timestamp.startsWith(dateStr))
      const openerAct = dayActs.find((ev) => ev.type === 'shop_open')
      const closerAct = [...dayActs].reverse().find((ev) => ev.type === 'shop_close')
      days.push({
        date,
        entries: filtered,
        shopOpener: openerAct?.userName || openerEntry?.staffName,
        shopCloser: closerAct?.userName || closerEntry?.staffName,
        isToday: date.getTime() === today.getTime(),
        isCurrentMonth: date.getMonth() === month,
      })
      if (date.getMonth() > month && date.getDay() === 6) break
    }
    return days.slice(0, 35)
  }, [currentMonth, entries, selectedStaff, activity])

  const staffNameById = useMemo(() => {
    const m: Record<string, string> = {}
    staff.forEach((s) => (m[s.id] = s.name))
    return m
  }, [staff])

  const eventRows = useMemo(() => {
    const entryById: Record<string, TimeEntry> = {}
    for (const e of entries) entryById[e.id] = e

    const now = Date.now()
    const cutoff = now - 30 * 24 * 60 * 60 * 1000

    const rows: EventRow[] = []
    for (const ev of activity) {
      const ts = Date.parse(ev.timestamp)
      if (!Number.isFinite(ts) || ts < cutoff) continue
      const type =
        ev.type === 'shop_open' || ev.type === 'shop_close' || ev.type === 'clock_in' || ev.type === 'clock_out'
          ? (ev.type as EventRow['type'])
          : 'note'
      const staffName =
        (ev.userName && ev.userName.trim()) || staffNameById[ev.userId] || 'Staff'

      let detail: string | undefined
      if (type === 'clock_out' && ev.entryId && entryById[ev.entryId]) {
        const ent = entryById[ev.entryId]
        const hrs = getHoursWorked(ent.clockIn, ent.clockOut, ent.breakMinutes)
        if (hrs !== null) detail = `${hrs.toFixed(1)}h${ent.breakMinutes ? ` (${ent.breakMinutes}m break)` : ''}`
      } else if (type === 'clock_in' && ev.entryId && entryById[ev.entryId]) {
        const ent = entryById[ev.entryId]
        if (ent.openedShop) detail = 'Opened shop'
      }

      rows.push({
        id: ev.id,
        timestamp: ev.timestamp,
        type,
        staffName,
        detail,
      })
    }

    // newest first
    rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0))
    return rows
  }, [activity, entries, staffNameById])

  const stats = {
    hours: summary?.hours?.total ?? 0,
    avgHours: summary?.hours?.avgPerDay ?? 0,
    revenue: summary?.revenue?.total ?? 0,
    tickets: summary?.tickets?.completed ?? 0,
  }

  const revenueData = summary?.revenue?.byDay || []
  const topRepairsData =
    summary?.topRepairs?.map((r, i) => ({
      name: r.name,
      value: r.percentage ?? r.count ?? 0,
      color: ['#8b5cf6', '#10b981', '#06b6d4', '#f59e0b', '#f43f5e'][i % 5],
    })) || []

  const navigateMonth = (d: number) => {
    setCurrentMonth((prev) => {
      const nd = new Date(prev)
      nd.setMonth(nd.getMonth() + d)
      return nd
    })
  }
  const goToToday = () => {
    setCurrentMonth(new Date())
    const today = calendarDays.find((d) => d.isToday)
    if (today) setSelectedDay(today)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-page-in">
        <Skeleton className="h-20 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-[110px] rounded-2xl" />
          <Skeleton className="h-[110px] rounded-2xl" />
          <Skeleton className="h-[110px] rounded-2xl" />
          <Skeleton className="h-[110px] rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn('transition-all duration-500', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <PageHeader
          title="Reports & Schedule"
          description="Track team hours, shop operations, and business performance at a glance."
          action={
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  'group relative px-5 py-2.5 rounded-xl inline-flex items-center gap-2',
                  'text-sm font-semibold text-white',
                  'transition-all duration-300 ease-out',
                  'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]'
                )}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          }
        />
      </div>

      <div className={cn('grid gap-4 md:grid-cols-4 transition-all duration-500 delay-100', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <StatCardMini icon={Clock} label="Hours This Week" value={`${stats.hours.toFixed(1)}h`} change="" positive />
        <StatCardMini icon={Target} label="Avg Hours/Day" value={`${stats.avgHours.toFixed(1)}h`} change="" positive />
        <StatCardMini icon={DollarSign} label="Weekly Revenue" value={`$${Math.round(stats.revenue)}`} change="" positive />
        <StatCardMini icon={Ticket} label="Repairs Completed" value={`${stats.tickets}`} change="" positive />
      </div>

      <div className={cn('grid gap-6 lg:grid-cols-3 transition-all duration-500 delay-200', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <div className="lg:col-span-2">
          <div className="rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white/95">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-medium hover:bg-violet-500/30 transition-all"
                  >
                    Today
                  </button>
                  <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/40" />
                <select
                  value={selectedStaff || ''}
                  onChange={(e) => setSelectedStaff(e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.04] border border-white/[0.08] text-white/80 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">All Staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-white/40 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => (
                <CalendarDayCell key={i} day={day} staff={staff} onSelect={setSelectedDay} isSelected={selectedDay?.date.getTime() === day.date.getTime()} />
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <StaffLegend staff={staff} />
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <DoorOpen className="w-3 h-3 text-emerald-400" /> Opened
                </span>
                <span className="flex items-center gap-1">
                  <DoorClosed className="w-3 h-3 text-amber-400" /> Closed
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDay ? (
            <DayDetailPanel day={selectedDay} staff={staff} />
          ) : (
            <div className="rounded-2xl p-6 border h-full flex flex-col items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
              <CalendarIcon className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/40 text-center">
                Select a day to see
                <br />
                who worked and when
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={cn('transition-all duration-500 delay-250', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <div className="rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white/90">Operational Events</h3>
              <p className="text-xs text-white/40">Clock-ins/outs + shop open/close (last 30 days)</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/50">
                  <th className="text-left font-medium py-2">When</th>
                  <th className="text-left font-medium py-2">Event</th>
                  <th className="text-left font-medium py-2">Staff</th>
                  <th className="text-left font-medium py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-white/40">
                      No events yet
                    </td>
                  </tr>
                ) : (
                  eventRows.slice(0, 50).map((r) => (
                    <tr key={r.id} className="border-t border-white/[0.06]">
                      <td className="py-2 text-white/70">
                        {new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="py-2 text-white/80 capitalize">
                        {r.type === 'clock_in' ? 'Clock in' : r.type === 'clock_out' ? 'Clock out' : r.type === 'shop_open' ? 'Shop open' : r.type === 'shop_close' ? 'Shop close' : r.type}
                      </td>
                      <td className="py-2 text-white/80">{r.staffName}</td>
                      <td className="py-2 text-white/50">{r.detail || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={cn('grid gap-6 lg:grid-cols-2 transition-all duration-500 delay-300', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <div className="rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90">Weekly Hours by Staff</h3>
            <span className="text-xs text-white/40">Last 7 days</span>
          </div>
          <WeeklyHoursChart entries={entries} staff={staff} />
        </div>

        <div className="rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90">Revenue Trend</h3>
            <span className="text-xs text-white/40">This week</span>
          </div>
          <RevenueChart data={revenueData} />
        </div>
      </div>

      <div className={cn('grid gap-6 lg:grid-cols-3 transition-all duration-500 delay-400', animationReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <div className="rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white/90 mb-4">Top Repair Types</h3>
          <TopRepairsChart data={topRepairsData} />
        </div>

        <div className="lg:col-span-2 rounded-3xl p-6 border bg-gradient-to-br from-white/[0.04] to-white/[0.02] border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white/90 mb-4">Staff Performance (This Week)</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {staff.map((s, i) => {
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              const staffEntries = entries.filter((e) => e.odisId === s.id && new Date(e.clockIn) >= weekAgo)
              const hours = staffEntries.reduce((sum, e) => sum + (getHoursWorked(e.clockIn, e.clockOut, e.breakMinutes) || 0), 0)
              const colors = STAFF_COLORS[i % STAFF_COLORS.length]
              const tickets = Math.floor(hours * 1.2)
              return (
                <div key={s.id} className={cn('p-4 rounded-xl border flex items-center justify-between', colors.bg, colors.border)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', colors.bg, colors.text)}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className={cn('font-semibold', colors.text)}>{s.name}</p>
                      <p className="text-xs text-white/50 capitalize">{s.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white/90">{hours.toFixed(1)}h</p>
                    <p className="text-xs text-white/50">{tickets} repairs</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsClient

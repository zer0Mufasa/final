'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Calendar,
  BarChart3,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Mock data
const revenueData = [
  { day: 'Mon', revenue: 1420, target: 1500 },
  { day: 'Tue', revenue: 1890, target: 1500 },
  { day: 'Wed', revenue: 1340, target: 1500 },
  { day: 'Thu', revenue: 2100, target: 1500 },
  { day: 'Fri', revenue: 2450, target: 1500 },
  { day: 'Sat', revenue: 1120, target: 1200 },
  { day: 'Sun', revenue: 680, target: 800 },
]

const repairTrends = [
  { week: 'W1', screens: 24, batteries: 12, ports: 8, other: 6 },
  { week: 'W2', screens: 28, batteries: 14, ports: 10, other: 5 },
  { week: 'W3', screens: 22, batteries: 18, ports: 7, other: 8 },
  { week: 'W4', screens: 31, batteries: 15, ports: 12, other: 7 },
]

const customerSatisfaction = [
  { rating: '5 ★', count: 42, color: '#22c55e' },
  { rating: '4 ★', count: 28, color: '#84cc16' },
  { rating: '3 ★', count: 8, color: '#eab308' },
  { rating: '2 ★', count: 2, color: '#f97316' },
  { rating: '1 ★', count: 1, color: '#ef4444' },
]

const hourlyTraffic = [
  { hour: '9am', customers: 3 },
  { hour: '10am', customers: 7 },
  { hour: '11am', customers: 12 },
  { hour: '12pm', customers: 8 },
  { hour: '1pm', customers: 5 },
  { hour: '2pm', customers: 9 },
  { hour: '3pm', customers: 14 },
  { hour: '4pm', customers: 11 },
  { hour: '5pm', customers: 8 },
  { hour: '6pm', customers: 4 },
]

const aiInsights = [
  {
    type: 'opportunity',
    icon: '💡',
    title: 'Upsell window detected',
    description: 'Customers getting screen repairs are 3x more likely to add a screen protector. Prompt at checkout.',
    impact: '+$340/week potential',
  },
  {
    type: 'warning',
    icon: '⚠️',
    title: 'Afternoon slowdown',
    description: 'Traffic drops 40% between 12-2pm. Consider lunch specials or appointment incentives.',
    impact: '18% revenue gap',
  },
  {
    type: 'success',
    icon: '🎯',
    title: 'Same-day completion up',
    description: 'Your same-day completion rate improved to 82% this week, up from 74% last month.',
    impact: '+8% improvement',
  },
  {
    type: 'alert',
    icon: '📦',
    title: 'Parts correlation found',
    description: 'iPhone 14 Pro screen stockouts correlate with 2-day longer promise times. Reorder at 5 units.',
    impact: 'Prevents delays',
  },
]

const topDevices = [
  { device: 'iPhone 14 Pro', repairs: 28, revenue: 5460 },
  { device: 'iPhone 13', repairs: 22, revenue: 3960 },
  { device: 'Samsung S23', repairs: 15, revenue: 2850 },
  { device: 'iPhone 12', repairs: 12, revenue: 1920 },
  { device: 'iPad Air', repairs: 8, revenue: 1840 },
]

export function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const totalRevenue = useMemo(() => revenueData.reduce((sum, d) => sum + d.revenue, 0), [])
  const avgTicket = 182
  const repeatRate = 34
  const avgTurnaround = '2h 15m'

  const stats = [
    {
      label: 'Revenue this week',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+12.4%',
      positive: true,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
    },
    {
      label: 'Avg repair time',
      value: avgTurnaround,
      change: '-12m',
      positive: true,
      icon: <Clock className="w-5 h-5" />,
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Repeat customers',
      value: `${repeatRate}%`,
      change: '+3 pts',
      positive: true,
      icon: <Users className="w-5 h-5" />,
      color: 'from-violet-500/20 to-violet-500/5',
      borderColor: 'border-violet-500/30',
    },
    {
      label: 'Avg ticket value',
      value: `$${avgTicket}`,
      change: '+$9',
      positive: true,
      icon: <Target className="w-5 h-5" />,
      color: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Insights" description="Loading analytics..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[400px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
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
        title="Insights"
        description="AI-powered analytics and actionable intelligence for your repair shop."
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/10 p-1">
              {(['week', 'month', 'quarter'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    timeRange === range
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
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
              <BarChart3 className="w-4 h-4" />
              Export Report
              <Sparkles className="w-3 h-3 opacity-60" />
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
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-2xl bg-gradient-to-br p-5 border transition-all hover:scale-[1.02]',
              stat.color,
              stat.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-white/[0.08] border border-white/10">
                {stat.icon}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold',
                  stat.positive ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {stat.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className={cn(
        "grid gap-4 lg:grid-cols-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        {/* Revenue Chart */}
        <GlassCard className="rounded-3xl lg:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">Revenue vs Target</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Daily revenue compared to goals</div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-[var(--text-muted)]">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/30 border border-white/20" />
                <span className="text-[var(--text-muted)]">Target</span>
              </div>
            </div>
          </div>
          <div className="h-[320px] px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ left: 8, right: 20, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(167,139,250,0.5)" />
                    <stop offset="100%" stopColor="rgba(167,139,250,0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,15,0.95)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  formatter={(value: number) => [`$${value}`, '']}
                />
                <Line type="monotone" dataKey="target" stroke="rgba(255,255,255,0.25)" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="rgba(167,139,250,0.9)" fill="url(#revenueGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* AI Insights */}
        <GlassCard className="rounded-3xl p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">AI Insights</div>
          </div>
          <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
            {aiInsights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl p-4 border transition-all hover:scale-[1.01] cursor-pointer',
                  insight.type === 'opportunity' && 'bg-emerald-500/[0.08] border-emerald-500/20',
                  insight.type === 'warning' && 'bg-amber-500/[0.08] border-amber-500/20',
                  insight.type === 'success' && 'bg-blue-500/[0.08] border-blue-500/20',
                  insight.type === 'alert' && 'bg-rose-500/[0.08] border-rose-500/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{insight.title}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{insight.description}</div>
                    <div className="text-xs font-semibold text-purple-300 mt-2">{insight.impact}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Second Row */}
      <div className={cn(
        "grid gap-4 lg:grid-cols-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '300ms' }}>
        {/* Repair Trends */}
        <GlassCard className="rounded-3xl p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border-default)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Repair Trends</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">By category over 4 weeks</div>
          </div>
          <div className="h-[280px] px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairTrends} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,15,0.95)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                />
                <Bar dataKey="screens" stackId="a" fill="rgba(167,139,250,0.7)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="batteries" stackId="a" fill="rgba(74,222,128,0.6)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ports" stackId="a" fill="rgba(56,189,248,0.6)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="other" stackId="a" fill="rgba(251,191,36,0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Customer Satisfaction */}
        <GlassCard className="rounded-3xl p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border-default)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Customer Satisfaction</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Review distribution</div>
          </div>
          <div className="h-[280px] px-4 py-4 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={customerSatisfaction}
                    dataKey="count"
                    nameKey="rating"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {customerSatisfaction.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,15,0.95)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                      color: 'white',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-[var(--text-primary)]">4.8</div>
                <div className="text-xs text-[var(--text-muted)]">avg rating</div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Peak Hours */}
        <GlassCard className="rounded-3xl p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border-default)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Peak Hours</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Customer traffic by hour</div>
          </div>
          <div className="h-[280px] px-4 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTraffic} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(56,189,248,0.5)" />
                    <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,10,15,0.95)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                />
                <Area type="monotone" dataKey="customers" stroke="rgba(56,189,248,0.9)" fill="url(#trafficGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Top Devices Table */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '400ms' }}>
      <GlassCard className="rounded-3xl p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Top Devices</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">Most repaired devices this period</div>
          </div>
          <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--text-faint)] border-b border-white/10">
                <th className="px-6 py-3">Device</th>
                <th className="px-6 py-3">Repairs</th>
                <th className="px-6 py-3">Revenue</th>
                <th className="px-6 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topDevices.map((device, i) => (
                <tr key={device.device} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{device.device}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{device.repairs}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)]">${device.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <ArrowUpRight className="w-3 h-3" />
                      +{Math.floor(Math.random() * 20 + 5)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      </div>
    </div>
  )
}

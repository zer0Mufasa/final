'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  Sparkles,
  Ticket,
  Stethoscope,
  DollarSign,
  Shield,
  MessageSquare,
  Package,
  Users,
  ChevronRight,
  Search,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Brain,
  Bot,
  Target,
  Activity,
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

type AIActivityType =
  | 'ticket-parse'
  | 'diagnosis'
  | 'panic-log'
  | 'price-suggestion'
  | 'risk-detection'
  | 'customer-insight'
  | 'inventory-suggestion'
  | 'chat-response'

type AIActivity = {
  id: string
  type: AIActivityType
  timestamp: Date
  ticketId?: string
  customerId?: string
  input: string
  output: string
  confidence: number
  wasAccepted?: boolean
  userFeedback?: 'helpful' | 'incorrect' | 'neutral'
  correctedValue?: string
  processingTime: number
  model: string
}

// Mock AI activities
const mockActivities: AIActivity[] = [
  {
    id: 'ai_001',
    type: 'ticket-parse',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    ticketId: 'FIX-1045',
    input: 'iPhone 14 Pro screen cracked John Smith 512-555-0142 dropped yesterday',
    output: JSON.stringify({
      device: 'iPhone 14 Pro',
      issue: 'Cracked screen',
      customer: 'John Smith',
      phone: '(512) 555-0142',
      notes: 'Dropped yesterday',
    }),
    confidence: 0.95,
    wasAccepted: true,
    processingTime: 342,
    model: 'gpt-4o-mini',
  },
  {
    id: 'ai_002',
    type: 'diagnosis',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    ticketId: 'FIX-1044',
    input: 'Phone gets hot, battery drains fast, started 2 weeks ago after update',
    output: 'Battery degradation likely. Symptoms indicate lithium cell deterioration post-software update. Recommend battery replacement.',
    confidence: 0.87,
    wasAccepted: true,
    userFeedback: 'helpful',
    processingTime: 1250,
    model: 'gpt-4o',
  },
  {
    id: 'ai_003',
    type: 'price-suggestion',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    ticketId: 'FIX-1043',
    input: 'Samsung S23 battery replacement, standard service',
    output: '$89.00 (Parts: $45, Labor: $30, Margin: $14)',
    confidence: 0.92,
    wasAccepted: true,
    processingTime: 180,
    model: 'gpt-4o-mini',
  },
  {
    id: 'ai_004',
    type: 'chat-response',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    input: 'how do I create a ticket?',
    output: 'To create a ticket, click the purple "+ New" button in the top navigation or press Ctrl+K to open the command palette and select "New Ticket". You can also use the Quick Intake feature to paste repair details and let AI parse them automatically.',
    confidence: 0.91,
    wasAccepted: undefined,
    userFeedback: 'helpful',
    processingTime: 520,
    model: 'gpt-4o',
  },
  {
    id: 'ai_005',
    type: 'risk-detection',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    ticketId: 'FIX-1042',
    customerId: 'cust_1003',
    input: 'Customer with 3 liquid damage claims in 60 days',
    output: 'MEDIUM RISK: Potential warranty abuse pattern detected. 3 liquid damage repairs in 60 days exceeds normal threshold (avg 0.2). Recommend requiring signed waiver and thorough documentation.',
    confidence: 0.78,
    wasAccepted: true,
    processingTime: 890,
    model: 'gpt-4o',
  },
  {
    id: 'ai_006',
    type: 'inventory-suggestion',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    input: 'Weekly inventory analysis for iPhone 14 Pro screens',
    output: 'REORDER RECOMMENDED: iPhone 14 Pro screens at 5 units (min: 2). Based on 12 repairs/week trend, reorder 15 units to maintain 2-week buffer. Lead time: 2 days.',
    confidence: 0.85,
    wasAccepted: false,
    correctedValue: 'Ordered 10 units instead',
    processingTime: 450,
    model: 'gpt-4o-mini',
  },
  {
    id: 'ai_007',
    type: 'ticket-parse',
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
    ticketId: 'FIX-1041',
    input: 'macbook pro 14 wont charge, customer maya 512-555-0199',
    output: JSON.stringify({
      device: 'MacBook Pro 14"',
      issue: 'Not charging',
      customer: 'Maya',
      phone: '(512) 555-0199',
    }),
    confidence: 0.88,
    wasAccepted: true,
    userFeedback: 'helpful',
    processingTime: 290,
    model: 'gpt-4o-mini',
  },
  {
    id: 'ai_008',
    type: 'customer-insight',
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    customerId: 'cust_1001',
    input: 'Customer Jordan Lee profile analysis',
    output: 'VIP CANDIDATE: $1,250 lifetime value, 3 devices on file, always pays on time. Recommend offering loyalty discount on next visit. Preferred contact: SMS.',
    confidence: 0.82,
    wasAccepted: undefined,
    processingTime: 680,
    model: 'gpt-4o',
  },
  {
    id: 'ai_009',
    type: 'diagnosis',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    ticketId: 'FIX-1040',
    input: 'iPad screen flickering, sometimes works fine, started gradually',
    output: 'Display connector issue likely (confidence: 72%). Could also be LCD degradation (28%). Recommend opening device to inspect flex cable connection before replacing screen.',
    confidence: 0.72,
    wasAccepted: false,
    userFeedback: 'incorrect',
    correctedValue: 'Was actually a software issue - resolved with restore',
    processingTime: 1100,
    model: 'gpt-4o',
  },
  {
    id: 'ai_010',
    type: 'panic-log',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    ticketId: 'FIX-1039',
    input: 'panic(cpu 0 caller...): userspace watchdog timeout...',
    output: 'KERNEL PANIC ANALYSIS: Userspace watchdog timeout indicates system freeze, likely caused by: 1) Failing storage controller (45%), 2) Memory corruption (30%), 3) CPU thermal throttling (25%). Recommend running diagnostics on SSD health first.',
    confidence: 0.68,
    wasAccepted: true,
    userFeedback: 'helpful',
    processingTime: 2100,
    model: 'gpt-4o',
  },
]

const typeConfig: Record<AIActivityType, { icon: React.ReactNode; label: string; color: string }> = {
  'ticket-parse': { icon: <Ticket className="w-4 h-4" />, label: 'Ticket Parse', color: 'purple' },
  'diagnosis': { icon: <Stethoscope className="w-4 h-4" />, label: 'Diagnosis', color: 'blue' },
  'panic-log': { icon: <AlertTriangle className="w-4 h-4" />, label: 'Panic Log', color: 'rose' },
  'price-suggestion': { icon: <DollarSign className="w-4 h-4" />, label: 'Price Suggestion', color: 'emerald' },
  'risk-detection': { icon: <Shield className="w-4 h-4" />, label: 'Risk Detection', color: 'amber' },
  'customer-insight': { icon: <Users className="w-4 h-4" />, label: 'Customer Insight', color: 'cyan' },
  'inventory-suggestion': { icon: <Package className="w-4 h-4" />, label: 'Inventory', color: 'orange' },
  'chat-response': { icon: <MessageSquare className="w-4 h-4" />, label: 'Chat Response', color: 'violet' },
}

const accuracyByType = [
  { type: 'Ticket Parse', accuracy: 95, count: 156 },
  { type: 'Diagnosis', accuracy: 87, count: 42 },
  { type: 'Pricing', accuracy: 92, count: 89 },
  { type: 'Chat', accuracy: 91, count: 234 },
  { type: 'Risk', accuracy: 78, count: 18 },
  { type: 'Inventory', accuracy: 85, count: 24 },
]

const dailyActivity = [
  { day: 'Mon', actions: 42 },
  { day: 'Tue', actions: 38 },
  { day: 'Wed', actions: 56 },
  { day: 'Thu', actions: 49 },
  { day: 'Fri', actions: 61 },
  { day: 'Sat', actions: 23 },
  { day: 'Sun', actions: 12 },
]

export function AIActivityPage() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [tab, setTab] = useState<'all' | 'accepted' | 'rejected' | 'pending'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<AIActivity | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const filteredActivities = useMemo(() => {
    let result = mockActivities

    if (tab === 'accepted') result = result.filter(a => a.wasAccepted === true)
    if (tab === 'rejected') result = result.filter(a => a.wasAccepted === false)
    if (tab === 'pending') result = result.filter(a => a.wasAccepted === undefined)

    if (typeFilter !== 'all') {
      result = result.filter(a => a.type === typeFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.input.toLowerCase().includes(q) ||
        a.output.toLowerCase().includes(q) ||
        a.ticketId?.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [tab, typeFilter, searchQuery])

  const stats = useMemo(() => {
    const totalActions = mockActivities.length
    const accepted = mockActivities.filter(a => a.wasAccepted === true).length
    const acceptanceRate = totalActions > 0 ? Math.round((accepted / totalActions) * 100) : 0
    const ticketsParsed = mockActivities.filter(a => a.type === 'ticket-parse').length
    const avgProcessingTime = Math.round(
      mockActivities.reduce((sum, a) => sum + a.processingTime, 0) / totalActions
    )

    return [
      { label: 'AI Actions', value: `${totalActions}`, sub: 'this week', icon: <Brain className="w-5 h-5" />, color: 'purple' },
      { label: 'Acceptance Rate', value: `${acceptanceRate}%`, sub: 'suggestions used', icon: <Target className="w-5 h-5" />, color: 'emerald' },
      { label: 'Tickets Parsed', value: `${ticketsParsed}`, sub: 'auto-filled', icon: <Ticket className="w-5 h-5" />, color: 'blue' },
      { label: 'Avg Response', value: `${avgProcessingTime}ms`, sub: 'processing time', icon: <Zap className="w-5 h-5" />, color: 'amber' },
    ]
  }, [])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-400'
    if (confidence >= 0.75) return 'text-blue-400'
    if (confidence >= 0.6) return 'text-amber-400'
    return 'text-rose-400'
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleFeedback = (id: string, feedback: 'helpful' | 'incorrect') => {
    // In real app, would send to backend
    console.log('Feedback submitted:', { id, feedback })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Activity" description="Loading..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
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
          title="AI Activity Log"
          description="Track all AI-powered actions, measure accuracy, and provide feedback to improve results."
          action={
            <div className="flex items-center gap-2">
              <button
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
                <RefreshCw className="w-4 h-4" />
                Refresh
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
            <div className="text-xs text-[var(--text-muted)] mt-1">{stat.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid gap-4 lg:grid-cols-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        {/* Activity List */}
        <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-[var(--border-default)]">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as any)}
              tabs={[
                { value: 'all', label: `All (${mockActivities.length})` },
                { value: 'accepted', label: `Accepted (${mockActivities.filter(a => a.wasAccepted === true).length})` },
                { value: 'rejected', label: `Rejected (${mockActivities.filter(a => a.wasAccepted === false).length})` },
                { value: 'pending', label: `Pending (${mockActivities.filter(a => a.wasAccepted === undefined).length})` },
              ]}
            />
          </div>

          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Search input or output..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="select bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <button className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-secondary)] text-sm flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                <Calendar className="w-4 h-4" /> Date
              </button>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Bot className="w-8 h-8" aria-hidden="true" />}
                title="No AI activity found"
                description="Adjust your filters to see more results."
              />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
              {filteredActivities.map((activity) => {
                const cfg = typeConfig[activity.type]
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'p-4 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group',
                      selectedActivity?.id === activity.id && 'bg-white/[0.04] border-l-2 border-purple-500'
                    )}
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl border',
                          cfg.color === 'purple' && 'bg-purple-500/15 text-purple-400 border-purple-500/20',
                          cfg.color === 'blue' && 'bg-blue-500/15 text-blue-400 border-blue-500/20',
                          cfg.color === 'rose' && 'bg-rose-500/15 text-rose-400 border-rose-500/20',
                          cfg.color === 'emerald' && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                          cfg.color === 'amber' && 'bg-amber-500/15 text-amber-400 border-amber-500/20',
                          cfg.color === 'cyan' && 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
                          cfg.color === 'orange' && 'bg-orange-500/15 text-orange-400 border-orange-500/20',
                          cfg.color === 'violet' && 'bg-violet-500/15 text-violet-400 border-violet-500/20'
                        )}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{cfg.label}</span>
                          {activity.ticketId && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 text-xs font-medium">
                              {activity.ticketId}
                            </span>
                          )}
                          <span className={cn('text-xs font-semibold', getConfidenceColor(activity.confidence))}>
                            {Math.round(activity.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {activity.input.length > 100 ? activity.input.slice(0, 100) + '...' : activity.input}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-[var(--text-muted)]">{formatTimestamp(activity.timestamp)}</span>
                          <span className="text-[var(--text-muted)]">{activity.processingTime}ms</span>
                          {activity.wasAccepted === true && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check className="w-3 h-3" /> Accepted
                            </span>
                          )}
                          {activity.wasAccepted === false && (
                            <span className="flex items-center gap-1 text-rose-400">
                              <X className="w-3 h-3" /> Rejected
                            </span>
                          )}
                          {activity.userFeedback === 'helpful' && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <ThumbsUp className="w-3 h-3" /> Helpful
                            </span>
                          )}
                          {activity.userFeedback === 'incorrect' && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <ThumbsDown className="w-3 h-3" /> Incorrect
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Activity Detail or Charts */}
          {selectedActivity ? (
            <GlassCard className="rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Activity Details</div>
                <button
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => setSelectedActivity(null)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-2xl border',
                  `bg-${typeConfig[selectedActivity.type].color}-500/10`,
                  `border-${typeConfig[selectedActivity.type].color}-500/20`
                )}>
                  <div className="flex items-center gap-3">
                    {typeConfig[selectedActivity.type].icon}
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {typeConfig[selectedActivity.type].label}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatTimestamp(selectedActivity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Confidence</span>
                    <span className={cn('text-sm font-semibold', getConfidenceColor(selectedActivity.confidence))}>
                      {Math.round(selectedActivity.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Processing Time</span>
                    <span className="text-sm text-[var(--text-primary)]">{selectedActivity.processingTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Model</span>
                    <span className="text-sm text-[var(--text-primary)]">{selectedActivity.model}</span>
                  </div>
                  {selectedActivity.ticketId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Ticket</span>
                      <span className="text-sm text-purple-300">{selectedActivity.ticketId}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Input</div>
                  <div className="text-sm text-[var(--text-secondary)] leading-relaxed bg-black/20 rounded-xl p-3 font-mono text-xs">
                    {selectedActivity.input}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">AI Output</div>
                  <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {selectedActivity.output}
                  </div>
                </div>

                {selectedActivity.correctedValue && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                    <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">User Correction</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {selectedActivity.correctedValue}
                    </div>
                  </div>
                )}

                {selectedActivity.wasAccepted === undefined && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      className="btn-primary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm"
                      onClick={() => handleFeedback(selectedActivity.id, 'helpful')}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful
                    </button>
                    <button
                      className="btn-secondary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm"
                      onClick={() => handleFeedback(selectedActivity.id, 'incorrect')}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Incorrect
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Weekly Activity Chart */}
              <GlassCard className="rounded-3xl p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-default)]">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Weekly Activity</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">AI actions per day</div>
                </div>
                <div className="h-[180px] px-2 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyActivity} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
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
                        formatter={(value: number) => [`${value} actions`, 'AI Actions']}
                      />
                      <Bar dataKey="actions" fill="rgba(167,139,250,0.6)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Accuracy by Type */}
              <GlassCard className="rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Accuracy by Type</div>
                </div>
                <div className="space-y-3">
                  {accuracyByType.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-[var(--text-secondary)]">{item.type}</span>
                        <span className={cn(
                          'text-sm font-semibold',
                          item.accuracy >= 90 ? 'text-emerald-400' :
                          item.accuracy >= 80 ? 'text-blue-400' :
                          item.accuracy >= 70 ? 'text-amber-400' : 'text-rose-400'
                        )}>
                          {item.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            item.accuracy >= 90 ? 'bg-emerald-500' :
                            item.accuracy >= 80 ? 'bg-blue-500' :
                            item.accuracy >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{item.count} samples</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Model Performance */}
              <GlassCard className="rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Model Performance</div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">gpt-4o</span>
                      <span className="text-sm font-semibold text-emerald-400">89% accuracy</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">124 actions • avg 1.2s</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">gpt-4o-mini</span>
                      <span className="text-sm font-semibold text-blue-400">91% accuracy</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">157 actions • avg 0.3s</div>
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Modal } from '@/components/dashboard/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Clock,
  User,
  Smartphone,
  DollarSign,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Flag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  History,
  Ban,
  CreditCard,
  RefreshCw,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  BookOpen,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
type RiskStatus = 'active' | 'investigating' | 'resolved' | 'dismissed'
type RiskType = 
  | 'stolen-device'
  | 'blacklisted-imei'
  | 'icloud-locked'
  | 'payment-dispute'
  | 'chargeback'
  | 'warranty-fraud'
  | 'customer-flag'
  | 'overdue-ticket'
  | 'inventory-discrepancy'
  | 'unusual-activity'

interface RiskItem {
  id: string
  type: RiskType
  severity: RiskSeverity
  status: RiskStatus
  title: string
  description: string
  detectedAt: Date
  ticketId?: string
  customerId?: string
  customerName?: string
  deviceImei?: string
  paymentId?: string
  recommendedActions: string[]
  playbookId?: string
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
  aiConfidence?: number
}

const mockRisks: RiskItem[] = [
  {
    id: 'risk_001',
    type: 'stolen-device',
    severity: 'critical',
    status: 'active',
    title: 'Stolen Device Alert',
    description: 'IMEI 35391284756... matches reported stolen database. Device flagged by GSMA.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 5),
    ticketId: 'FIX-1052',
    customerName: 'Unknown Walk-in',
    deviceImei: '353912847560123',
    recommendedActions: [
      'Do NOT return device to customer',
      'Contact local authorities',
      'Document interaction with photos',
      'Retain device securely',
    ],
    playbookId: 'playbook_stolen',
    aiConfidence: 0.95,
  },
  {
    id: 'risk_002',
    type: 'chargeback',
    severity: 'critical',
    status: 'active',
    title: 'Chargeback Received',
    description: 'Payment disputed for INV-2025-038 ($329.00). Customer claims "unauthorized transaction".',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    ticketId: 'FIX-1043',
    customerId: 'cust_1003',
    customerName: 'Chris Nguyen',
    paymentId: 'pay_003',
    recommendedActions: [
      'Gather repair documentation and photos',
      'Respond to dispute within 7 days',
      'Contact customer to resolve directly',
      'Flag customer for future transactions',
    ],
    playbookId: 'playbook_chargeback',
    aiConfidence: 1.0,
  },
  {
    id: 'risk_003',
    type: 'overdue-ticket',
    severity: 'high',
    status: 'active',
    title: 'Overdue Ticket',
    description: 'FIX-1044 promised 2 days ago, still in repair. Customer has called twice.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    ticketId: 'FIX-1044',
    customerId: 'cust_1004',
    customerName: 'Taylor Brooks',
    recommendedActions: [
      'Contact customer immediately',
      'Offer discount or expedited service',
      'Escalate to lead technician',
    ],
    aiConfidence: 0.88,
  },
  {
    id: 'risk_004',
    type: 'warranty-fraud',
    severity: 'medium',
    status: 'investigating',
    title: 'Repeat Liquid Damage Claims',
    description: '3 prior liquid repairs in 60 days for same customer. Potential warranty abuse pattern.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    customerId: 'cust_1005',
    customerName: 'Sam Chen',
    recommendedActions: [
      'Require signed waiver before repair',
      'Document device condition thoroughly',
      'Consider declining warranty coverage',
    ],
    playbookId: 'playbook_warranty',
    aiConfidence: 0.78,
  },
  {
    id: 'risk_005',
    type: 'payment-dispute',
    severity: 'medium',
    status: 'active',
    title: 'Payment Dispute History',
    description: 'Customer filed chargeback last quarter. Requires upfront payment.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    customerId: 'cust_1006',
    customerName: 'Jordan Lee',
    recommendedActions: [
      'Require full payment before work begins',
      'Get written approval for all charges',
    ],
    aiConfidence: 0.82,
  },
  {
    id: 'risk_006',
    type: 'customer-flag',
    severity: 'low',
    status: 'active',
    title: 'Suspected Fraud Pattern',
    description: 'Multiple repairs at different shops, reported stolen at each. Known scam pattern.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    customerName: 'New Customer',
    recommendedActions: [
      'Verify identity with photo ID',
      'Check IMEI before accepting device',
      'Require deposit',
    ],
    aiConfidence: 0.65,
  },
  {
    id: 'risk_007',
    type: 'blacklisted-imei',
    severity: 'medium',
    status: 'resolved',
    title: 'Parts Mismatch Detected',
    description: 'Serial number doesn\'t match original housing. Device may have been tampered with.',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    ticketId: 'FIX-1038',
    customerId: 'cust_1007',
    customerName: 'Alex Rivera',
    recommendedActions: [],
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    resolvedBy: 'Mufasa',
    resolution: 'Customer provided original purchase receipt. Parts were replaced by authorized service.',
    aiConfidence: 0.72,
  },
]

const playbooks = [
  {
    id: 'playbook_stolen',
    trigger: 'IMEI flagged / Stolen device',
    severity: 'critical',
    steps: [
      'Do NOT accept device for repair',
      'Politely decline and document interaction',
      'Contact local law enforcement if customer is present',
      'Retain any photos or identifying information',
      'Log incident in risk system',
    ],
  },
  {
    id: 'playbook_chargeback',
    trigger: 'Chargeback / Payment dispute',
    severity: 'critical',
    steps: [
      'Gather all repair documentation within 24 hours',
      'Collect before/after photos of repair',
      'Get signed approval forms and receipts',
      'Respond to dispute within 7 days',
      'Contact customer to attempt direct resolution',
      'Flag customer account for future transactions',
    ],
  },
  {
    id: 'playbook_warranty',
    trigger: 'Repeat damage / Warranty abuse',
    severity: 'warning',
    steps: [
      'Review customer repair history',
      'Require signed waiver acknowledging damage cause',
      'Document device condition with photos',
      'Consider declining warranty on future repairs',
      'Notify customer of policy in writing',
    ],
  },
  {
    id: 'playbook_overdue',
    trigger: 'Overdue pickup / Abandoned device',
    severity: 'info',
    steps: [
      'Contact customer via phone and SMS',
      'Send email notification with pickup deadline',
      'Apply storage fee policy after 14 days',
      'Send certified letter at 30 days',
      'Follow local abandoned property laws at 60 days',
    ],
  },
]

const riskTrend = [
  { day: 'Mon', risks: 3 },
  { day: 'Tue', risks: 2 },
  { day: 'Wed', risks: 4 },
  { day: 'Thu', risks: 1 },
  { day: 'Fri', risks: 2 },
  { day: 'Sat', risks: 0 },
  { day: 'Sun', risks: 0 },
]

export function RiskMonitorPage() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [tab, setTab] = useState<'active' | 'resolved' | 'all'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null)
  const [playbookOpen, setPlaybookOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const filteredRisks = useMemo(() => {
    let result = mockRisks

    if (tab === 'active') result = result.filter(r => r.status === 'active' || r.status === 'investigating')
    if (tab === 'resolved') result = result.filter(r => r.status === 'resolved' || r.status === 'dismissed')

    if (severityFilter !== 'all') {
      result = result.filter(r => r.severity === severityFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.ticketId?.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => {
      // Sort by severity first, then by date
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (sevDiff !== 0) return sevDiff
      return b.detectedAt.getTime() - a.detectedAt.getTime()
    })
  }, [tab, severityFilter, searchQuery])

  const riskStats = useMemo(() => {
    const active = mockRisks.filter(r => r.status === 'active' || r.status === 'investigating')
    const critical = active.filter(r => r.severity === 'critical').length
    const high = active.filter(r => r.severity === 'high').length
    const resolvedThisWeek = mockRisks.filter(r => 
      r.resolvedAt && r.resolvedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length

    // Calculate overall risk score (0-100)
    const riskScore = Math.max(0, Math.min(100, 
      100 - (critical * 25) - (high * 10) - (active.length * 3)
    ))

    return {
      activeFlags: active.length,
      critical,
      high,
      resolvedThisWeek,
      riskScore,
    }
  }, [])

  const getSeverityStyles = (severity: RiskSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
    }
  }

  const getStatusStyles = (status: RiskStatus) => {
    switch (status) {
      case 'active':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      case 'investigating':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'resolved':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'dismissed':
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
      default:
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
    }
  }

  const getTypeIcon = (type: RiskType) => {
    switch (type) {
      case 'stolen-device':
      case 'blacklisted-imei':
        return <Ban className="w-4 h-4" />
      case 'icloud-locked':
        return <Smartphone className="w-4 h-4" />
      case 'payment-dispute':
      case 'chargeback':
        return <CreditCard className="w-4 h-4" />
      case 'warranty-fraud':
        return <RefreshCw className="w-4 h-4" />
      case 'customer-flag':
        return <Flag className="w-4 h-4" />
      case 'overdue-ticket':
        return <Clock className="w-4 h-4" />
      case 'inventory-discrepancy':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    if (score >= 25) return 'text-orange-400'
    return 'text-rose-400'
  }

  const getRiskScoreLabel = (score: number) => {
    if (score >= 75) return 'LOW RISK'
    if (score >= 50) return 'MODERATE'
    if (score >= 25) return 'ELEVATED'
    return 'HIGH RISK'
  }

  if (loading) {
    return (
      <div className="px-4 py-5 sm:p-6 space-y-6">
        <PageHeader title="Risk Monitor" description="Loading..." />
        <Skeleton className="h-[120px] rounded-3xl" />
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
    <div className="px-4 py-5 sm:p-6 space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Risk Monitor"
          description="Proactive risk identification and mitigation. Protect your shop from fraud and disputes."
          action={
            <button
              onClick={() => setPlaybookOpen(true)}
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
              <BookOpen className="w-4 h-4" />
              View Playbook
            </button>
          }
        />
      </div>

      {/* Overall Risk Score */}
      <GlassCard className={cn(
        "rounded-3xl transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Overall Risk Score</div>
        <div className="flex items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <span className={cn('text-5xl font-bold', getRiskScoreColor(riskStats.riskScore))}>
                {riskStats.riskScore}
              </span>
              <span className={cn('text-sm font-semibold px-3 py-1 rounded-lg', getRiskScoreColor(riskStats.riskScore))}>
                {getRiskScoreLabel(riskStats.riskScore)}
              </span>
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
              <div className="flex h-full">
                <div className="h-full bg-emerald-500" style={{ width: '25%' }} />
                <div className="h-full bg-amber-500" style={{ width: '25%' }} />
                <div className="h-full bg-orange-500" style={{ width: '25%' }} />
                <div className="h-full bg-rose-500" style={{ width: '25%' }} />
              </div>
              <div 
                className="relative -top-3 w-3 h-3 bg-white rounded-full border-2 border-[var(--bg-page)] shadow-lg transition-all"
                style={{ marginLeft: `${Math.min(97, riskStats.riskScore)}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        <GlassCard className="p-5 rounded-2xl border border-rose-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <ShieldX className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{riskStats.critical}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Critical Risks</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{riskStats.high}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">High Priority</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{riskStats.activeFlags}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Active Flags</div>
        </GlassCard>

        <GlassCard className="p-5 rounded-2xl border border-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{riskStats.resolvedThisWeek}</div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3">Resolved This Week</div>
        </GlassCard>
      </div>

      {/* Main Content */}
      <div className={cn(
        "grid gap-4 lg:grid-cols-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '300ms' }}>
        {/* Risk List */}
        <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-[var(--border-default)]">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as any)}
              tabs={[
                { value: 'active', label: `Active (${mockRisks.filter(r => r.status === 'active' || r.status === 'investigating').length})` },
                { value: 'resolved', label: 'Resolved' },
                { value: 'all', label: 'All' },
              ]}
            />
          </div>

          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  placeholder="Search risks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="select bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)]"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {filteredRisks.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">All clear!</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">No risk flags to display.</div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
              {filteredRisks.map((risk) => (
                <div
                  key={risk.id}
                  className={cn(
                    'p-4 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group',
                    risk.status === 'resolved' && 'opacity-60'
                  )}
                  onClick={() => setSelectedRisk(risk)}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2.5 rounded-xl border', getSeverityStyles(risk.severity))}>
                      {getTypeIcon(risk.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border', getSeverityStyles(risk.severity))}>
                          {risk.severity}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{risk.title}</span>
                        {risk.status !== 'active' && (
                          <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold capitalize border', getStatusStyles(risk.status))}>
                            {risk.status}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {risk.description}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        {risk.ticketId && (
                          <span className="text-purple-300">{risk.ticketId}</span>
                        )}
                        {risk.customerName && (
                          <span>{risk.customerName}</span>
                        )}
                        <span>{formatTimestamp(risk.detectedAt)}</span>
                        {risk.aiConfidence && (
                          <span className="text-blue-300">AI: {Math.round(risk.aiConfidence * 100)}%</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          {selectedRisk ? (
            <GlassCard className="rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Risk Details</div>
                <button
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => setSelectedRisk(null)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className={cn('p-4 rounded-2xl border', getSeverityStyles(selectedRisk.severity))}>
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedRisk.type)}
                    <div>
                      <div className="text-sm font-semibold">{selectedRisk.title}</div>
                      <div className="text-xs mt-0.5 opacity-80">{selectedRisk.severity.toUpperCase()} priority</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-3">
                  {selectedRisk.ticketId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Ticket</span>
                      <span className="text-sm text-purple-300">{selectedRisk.ticketId}</span>
                    </div>
                  )}
                  {selectedRisk.customerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Customer</span>
                      <span className="text-sm text-[var(--text-primary)]">{selectedRisk.customerName}</span>
                    </div>
                  )}
                  {selectedRisk.deviceImei && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">IMEI</span>
                      <span className="text-sm text-[var(--text-primary)] font-mono">{selectedRisk.deviceImei.slice(0, 8)}...</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Detected</span>
                    <span className="text-sm text-[var(--text-primary)]">{formatTimestamp(selectedRisk.detectedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Status</span>
                    <span className={cn('px-2 py-0.5 rounded-lg text-xs font-semibold capitalize border', getStatusStyles(selectedRisk.status))}>
                      {selectedRisk.status}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Description</div>
                  <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedRisk.description}</div>
                </div>

                {selectedRisk.recommendedActions.length > 0 && (
                  <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4">
                    <div className="text-xs text-purple-300 uppercase tracking-wider mb-2">Recommended Actions</div>
                    <ul className="space-y-2">
                      {selectedRisk.recommendedActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <span className="text-purple-400 mt-0.5">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRisk.resolution && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                    <div className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Resolution</div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{selectedRisk.resolution}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-2">
                      Resolved by {selectedRisk.resolvedBy} • {formatTimestamp(selectedRisk.resolvedAt!)}
                    </div>
                  </div>
                )}

                {selectedRisk.status === 'active' && (
                  <div className="flex items-center gap-2">
                    <button className="btn-secondary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm">
                      <Eye className="w-4 h-4" />
                      Investigate
                    </button>
                    <button className="btn-primary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Risk Trend */}
              <GlassCard className="rounded-3xl p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-default)]">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Risk Trend</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">New flags this week</div>
                </div>
                <div className="h-[150px] px-2 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={riskTrend} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(239,68,68,0.4)" />
                          <stop offset="100%" stopColor="rgba(239,68,68,0.02)" />
                        </linearGradient>
                      </defs>
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
                        formatter={(value: number) => [`${value} flags`, 'Risks']}
                      />
                      <Area type="monotone" dataKey="risks" stroke="rgba(239,68,68,0.9)" fill="url(#riskGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Quick Playbook */}
              <GlassCard className="rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Quick Playbook</div>
                </div>
                <div className="space-y-3">
                  {playbooks.slice(0, 3).map((playbook) => (
                    <div
                      key={playbook.id}
                      className={cn(
                        'rounded-2xl p-4 border cursor-pointer hover:scale-[1.01] transition-all',
                        playbook.severity === 'critical' && 'bg-rose-500/[0.08] border-rose-500/20',
                        playbook.severity === 'warning' && 'bg-amber-500/[0.08] border-amber-500/20',
                        playbook.severity === 'info' && 'bg-blue-500/[0.08] border-blue-500/20'
                      )}
                      onClick={() => setPlaybookOpen(true)}
                    >
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{playbook.trigger}</div>
                      <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{playbook.steps[0]}</div>
                    </div>
                  ))}
                </div>
                <button 
                  className="w-full mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  onClick={() => setPlaybookOpen(true)}
                >
                  View all playbooks →
                </button>
              </GlassCard>
            </>
          )}
        </div>
      </div>

      {/* Playbook Modal */}
      <Modal
        open={playbookOpen}
        onOpenChange={setPlaybookOpen}
        title="Risk Response Playbooks"
        description="Step-by-step guides for handling common risk scenarios."
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {playbooks.map((playbook) => (
            <div
              key={playbook.id}
              className={cn(
                'rounded-2xl p-5 border',
                playbook.severity === 'critical' && 'bg-rose-500/[0.08] border-rose-500/20',
                playbook.severity === 'warning' && 'bg-amber-500/[0.08] border-amber-500/20',
                playbook.severity === 'info' && 'bg-blue-500/[0.08] border-blue-500/20'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  'px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase',
                  playbook.severity === 'critical' && 'bg-rose-500/30 text-rose-300',
                  playbook.severity === 'warning' && 'bg-amber-500/30 text-amber-300',
                  playbook.severity === 'info' && 'bg-blue-500/30 text-blue-300'
                )}>
                  {playbook.severity}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{playbook.trigger}</span>
              </div>
              <ol className="space-y-2">
                {playbook.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

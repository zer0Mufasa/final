'use client'

import { cn } from '@/lib/utils/cn'
import type { RiskFlag, TicketStatus } from '@/lib/mock/types'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  HeartHandshake,
  Package,
  PauseCircle,
  Truck,
  Wrench,
} from 'lucide-react'

type StatusTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

const toneClass: Record<StatusTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/25',
  info: 'bg-blue-500/15 text-blue-200 border border-blue-500/25',
  danger: 'bg-red-500/15 text-red-200 border border-red-500/25',
  neutral: 'bg-white/5 text-white/70 border border-white/10',
}

const statusMap: Record<TicketStatus, { label: string; tone: StatusTone; icon: React.ReactNode; tooltip: string }> = {
  INTAKE: { label: 'Intake', tone: 'info', icon: <Clock className="w-3 h-3" />, tooltip: 'Ticket captured, awaiting triage' },
  DIAGNOSED: { label: 'Diagnosed', tone: 'warning', icon: <Wrench className="w-3 h-3" />, tooltip: 'Issue understood, plan set' },
  WAITING_PARTS: { label: 'Waiting Parts', tone: 'warning', icon: <Package className="w-3 h-3" />, tooltip: 'Parts ordered / en route' },
  IN_REPAIR: { label: 'In Repair', tone: 'info', icon: <HeartHandshake className="w-3 h-3" />, tooltip: 'Bench work in progress' },
  READY: { label: 'Ready', tone: 'success', icon: <CheckCircle className="w-3 h-3" />, tooltip: 'Ready for pickup' },
  PICKED_UP: { label: 'Picked Up', tone: 'neutral', icon: <Truck className="w-3 h-3" />, tooltip: 'Customer collected the device' },
}

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const m = statusMap[status]
  return (
    <span
      title={m.tooltip}
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', toneClass[m.tone], className)}
    >
      {m.icon}
      {m.label}
    </span>
  )
}

export function RiskBadge({ risk, className }: { risk: RiskFlag; className?: string }) {
  const map: Record<RiskFlag, { label: string; cls: string; icon: React.ReactNode }> = {
    none: { label: 'No flag', cls: 'bg-white/5 text-white/50 border border-white/10', icon: <PauseCircle className="w-3 h-3" /> },
    low: { label: 'Low risk', cls: 'bg-green-500/15 text-green-300 border border-green-400/20', icon: <CheckCircle className="w-3 h-3" /> },
    medium: { label: 'Watch', cls: 'bg-yellow-500/15 text-yellow-300 border border-yellow-400/20', icon: <AlertTriangle className="w-3 h-3" /> },
    high: { label: 'High risk', cls: 'bg-red-500/15 text-red-300 border border-red-400/20', icon: <AlertCircle className="w-3 h-3" /> },
  }
  const m = map[risk]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', m.cls, className)}>
      {m.icon}
      {m.label}
    </span>
  )
}



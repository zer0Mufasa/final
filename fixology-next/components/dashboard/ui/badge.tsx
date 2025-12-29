'use client'

import { cn } from '@/lib/utils/cn'
import type { RiskFlag, TicketStatus } from '@/lib/mock/types'

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const map: Record<TicketStatus, { label: string; cls: string }> = {
    INTAKE: { label: 'Intake', cls: 'bg-blue-500/20 text-blue-300' },
    DIAGNOSED: { label: 'Diagnosed', cls: 'bg-purple-500/20 text-purple-300' },
    WAITING_PARTS: { label: 'Waiting Parts', cls: 'bg-yellow-500/20 text-yellow-300' },
    IN_REPAIR: { label: 'In Repair', cls: 'bg-indigo-500/20 text-indigo-300' },
    READY: { label: 'Ready', cls: 'bg-green-500/20 text-green-300' },
    PICKED_UP: { label: 'Picked Up', cls: 'bg-gray-500/20 text-gray-300' },
  }
  const m = map[status]
  return <span className={cn('badge', m.cls, className)}>{m.label}</span>
}

export function RiskBadge({ risk, className }: { risk: RiskFlag; className?: string }) {
  const map: Record<RiskFlag, { label: string; cls: string }> = {
    none: { label: 'No flag', cls: 'bg-white/5 text-white/50 border border-white/10' },
    low: { label: 'Low risk', cls: 'bg-green-500/15 text-green-300 border border-green-400/20' },
    medium: { label: 'Watch', cls: 'bg-yellow-500/15 text-yellow-300 border border-yellow-400/20' },
    high: { label: 'High risk', cls: 'bg-red-500/15 text-red-300 border border-red-400/20' },
  }
  const m = map[risk]
  return <span className={cn('badge', 'border', m.cls, className)}>{m.label}</span>
}



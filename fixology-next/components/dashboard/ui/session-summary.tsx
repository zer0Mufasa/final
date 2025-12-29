'use client'

// components/dashboard/ui/session-summary.tsx
// "Since last login" summary card

import { GlassCard } from './glass-card'
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface SessionSummaryProps {
  ticketsProgressed: number
  overdueCount: number
  lastLogin?: Date
  className?: string
}

export function SessionSummary({ ticketsProgressed, overdueCount, lastLogin, className }: SessionSummaryProps) {
  return (
    <GlassCard className={`p-4 rounded-2xl ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-white/50" />
        <div className="text-sm font-semibold text-white/90">Since last login</div>
        {lastLogin && (
          <div className="text-xs text-white/40">
            {new Date(lastLogin).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span>Tickets progressed</span>
          </div>
          <div className="text-sm font-bold text-white">{ticketsProgressed}</div>
        </div>

        {overdueCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <AlertTriangle className="w-4 h-4 text-red-300" />
              <span>Overdue</span>
            </div>
            <div className="text-sm font-bold text-red-300">{overdueCount}</div>
          </div>
        )}

        {overdueCount === 0 && ticketsProgressed > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>All on track</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}


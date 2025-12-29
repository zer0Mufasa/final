'use client'

// components/dashboard/ui/workload-widgets.tsx
// Workload visualization widgets: pressure meters, load rings, time-to-promise bars

import { GlassCard } from './glass-card'
import { cn } from '@/lib/utils/cn'
import { Users, Clock, AlertCircle, Package } from 'lucide-react'

interface QueuePressureMeterProps {
  current: number
  capacity: number
  label?: string
}

export function QueuePressureMeter({ current, capacity, label = 'Queue pressure' }: QueuePressureMeterProps) {
  const percentage = Math.min((current / capacity) * 100, 100)
  const isHigh = percentage >= 80
  const isMedium = percentage >= 50 && percentage < 80

  const color = isHigh ? 'from-red-500 to-red-600' : isMedium ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'

  return (
    <GlassCard className="p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-white/70">{label}</div>
        <div className={cn('text-sm font-bold', isHigh ? 'text-red-300' : isMedium ? 'text-yellow-300' : 'text-green-300')}>
          {current} / {capacity}
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isHigh && (
        <div className="mt-2 text-xs text-red-300 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Near capacity
        </div>
      )}
    </GlassCard>
  )
}

interface TechLoadRingProps {
  name: string
  assigned: number
  max: number
  color?: string
}

export function TechLoadRing({ name, assigned, max, color = 'purple' }: TechLoadRingProps) {
  const percentage = Math.min((assigned / max) * 100, 100)
  const circumference = 2 * Math.PI * 36 // radius = 36
  const offset = circumference - (percentage / 100) * circumference

  const colorClasses = {
    purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-300' },
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-300' },
    green: { bg: 'from-green-500 to-green-600', text: 'text-green-300' },
    yellow: { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-300' },
  }

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="url(#gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(168, 85, 247)" />
              <stop offset="100%" stopColor="rgb(147, 51, 234)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={cn('text-lg font-bold', colors.text)}>{assigned}</div>
            <div className="text-[10px] text-white/40">/{max}</div>
          </div>
        </div>
      </div>
      <div className="text-xs font-medium text-white/70 text-center max-w-[80px] truncate">{name}</div>
    </div>
  )
}

interface TimeToPromiseBarProps {
  tickets: Array<{ id: string; promisedAt: string; ticketNumber: string }>
}

export function TimeToPromiseBar({ tickets }: TimeToPromiseBarProps) {
  const now = Date.now()
  const hoursFromNow = (iso: string) => Math.round((new Date(iso).getTime() - now) / (60 * 60 * 1000))

  const overdue = tickets.filter((t) => hoursFromNow(t.promisedAt) < 0).length
  const dueSoon = tickets.filter((t) => {
    const hrs = hoursFromNow(t.promisedAt)
    return hrs >= 0 && hrs <= 4
  }).length
  const onTime = tickets.filter((t) => {
    const hrs = hoursFromNow(t.promisedAt)
    return hrs > 4
  }).length

  const total = tickets.length

  return (
    <GlassCard className="p-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-white/50" />
        <div className="text-xs font-semibold text-white/70">Time to promise</div>
      </div>
      <div className="flex h-6 rounded-lg overflow-hidden bg-white/5">
        {overdue > 0 && (
          <div
            className="bg-red-500/80 flex items-center justify-center text-[10px] font-semibold text-white"
            style={{ width: `${(overdue / total) * 100}%` }}
          >
            {overdue}
          </div>
        )}
        {dueSoon > 0 && (
          <div
            className="bg-yellow-500/80 flex items-center justify-center text-[10px] font-semibold text-white"
            style={{ width: `${(dueSoon / total) * 100}%` }}
          >
            {dueSoon}
          </div>
        )}
        {onTime > 0 && (
          <div
            className="bg-green-500/80 flex items-center justify-center text-[10px] font-semibold text-white"
            style={{ width: `${(onTime / total) * 100}%` }}
          >
            {onTime}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Overdue ({overdue})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Due soon ({dueSoon})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>On time ({onTime})</span>
        </div>
      </div>
    </GlassCard>
  )
}

interface BottleneckDetectorProps {
  bottlenecks: Array<{ type: string; count: number; message: string }>
}

export function BottleneckDetector({ bottlenecks }: BottleneckDetectorProps) {
  if (bottlenecks.length === 0) return null

  const primary = bottlenecks[0]

  return (
    <GlassCard className="p-4 rounded-2xl border-amber-400/30 bg-amber-500/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white/90 mb-1">Bottleneck detected</div>
          <div className="text-xs text-white/70 leading-relaxed">{primary.message}</div>
          {bottlenecks.length > 1 && (
            <div className="mt-2 text-xs text-white/50">
              +{bottlenecks.length - 1} more bottleneck{bottlenecks.length - 1 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}


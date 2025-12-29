'use client'

// components/dashboard/ui/state-banner.tsx
// Subtle glass banners for system states (billing, outdated data, overdue tickets, etc.)

import { AlertTriangle, CreditCard, Clock, Archive, Database, Lock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type BannerType = 'billing' | 'outdated' | 'overdue' | 'archived' | 'error' | 'locked' | 'readonly'

interface StateBannerProps {
  type: BannerType
  message: string
  action?: { label: string; onClick: () => void }
  onDismiss?: () => void
  className?: string
}

const bannerConfig: Record<BannerType, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  billing: {
    icon: <CreditCard className="w-4 h-4" />,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
  },
  outdated: {
    icon: <Database className="w-4 h-4" />,
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
  },
  overdue: {
    icon: <Clock className="w-4 h-4" />,
    bg: 'bg-red-500/10',
    border: 'border-red-400/30',
    text: 'text-red-300',
  },
  archived: {
    icon: <Archive className="w-4 h-4" />,
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/60',
  },
  error: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: 'bg-red-500/10',
    border: 'border-red-400/30',
    text: 'text-red-300',
  },
  locked: {
    icon: <Lock className="w-4 h-4" />,
    bg: 'bg-purple-500/10',
    border: 'border-purple-400/30',
    text: 'text-purple-300',
  },
  readonly: {
    icon: <Eye className="w-4 h-4" />,
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
  },
}

export function StateBanner({ type, message, action, onDismiss, className }: StateBannerProps) {
  const config = bannerConfig[type]

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-sm',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn('flex-shrink-0', config.text)}>{config.icon}</span>
        <span className={cn('text-sm font-medium', config.text)}>{message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              'bg-white/10 hover:bg-white/15',
              config.text
            )}
          >
            {action.label}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn('p-1.5 rounded-lg hover:bg-white/10 transition-colors', config.text)}
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}


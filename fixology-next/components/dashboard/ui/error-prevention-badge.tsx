'use client'

// components/dashboard/ui/error-prevention-badge.tsx
// Visual guardrails and nudges (not blocking, just visual)

import { AlertCircle, DollarSign, Clock, Smartphone, User, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ErrorPreventionType = 'no-price' | 'no-promised-time' | 'no-imei' | 'no-contact' | 'complete'

interface ErrorPreventionBadgeProps {
  type: ErrorPreventionType
  message: string
  className?: string
}

const badgeConfig: Record<ErrorPreventionType, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  'no-price': {
    icon: <DollarSign className="w-3.5 h-3.5" />,
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/30',
    text: 'text-amber-300',
  },
  'no-promised-time': {
    icon: <Clock className="w-3.5 h-3.5" />,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
  },
  'no-imei': {
    icon: <Smartphone className="w-3.5 h-3.5" />,
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
  },
  'no-contact': {
    icon: <User className="w-3.5 h-3.5" />,
    bg: 'bg-red-500/10',
    border: 'border-red-400/30',
    text: 'text-red-300',
  },
  complete: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    bg: 'bg-green-500/10',
    border: 'border-green-400/30',
    text: 'text-green-300',
  },
}

export function ErrorPreventionBadge({ type, message, className }: ErrorPreventionBadgeProps) {
  const config = badgeConfig[type]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {config.icon}
      <span>{message}</span>
    </div>
  )
}


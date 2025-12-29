'use client'

// components/dashboard/ui/context-chip.tsx
// Small context chips for operator memory aids

import { Clock, MessageSquare, Repeat, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ContextChipType = 'last-interaction' | 'preference' | 'repeat-issue' | 'warranty' | 'vip'

interface ContextChipProps {
  type: ContextChipType
  value: string
  className?: string
}

const chipConfig: Record<ContextChipType, { icon: React.ReactNode; bg: string; text: string }> = {
  'last-interaction': {
    icon: <Clock className="w-3 h-3" />,
    bg: 'bg-blue-500/10 border-blue-400/20',
    text: 'text-blue-300',
  },
  preference: {
    icon: <User className="w-3 h-3" />,
    bg: 'bg-purple-500/10 border-purple-400/20',
    text: 'text-purple-300',
  },
  'repeat-issue': {
    icon: <Repeat className="w-3 h-3" />,
    bg: 'bg-amber-500/10 border-amber-400/20',
    text: 'text-amber-300',
  },
  warranty: {
    icon: <Shield className="w-3 h-3" />,
    bg: 'bg-green-500/10 border-green-400/20',
    text: 'text-green-300',
  },
  vip: {
    icon: <MessageSquare className="w-3 h-3" />,
    bg: 'bg-yellow-500/10 border-yellow-400/20',
    text: 'text-yellow-300',
  },
}

export function ContextChip({ type, value, className }: ContextChipProps) {
  const config = chipConfig[type]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.icon}
      <span>{value}</span>
    </div>
  )
}


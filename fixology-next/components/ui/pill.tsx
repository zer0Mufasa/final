'use client'

import { cn } from '@/lib/utils/cn'

const toneMap = {
  neutral: 'bg-white/[0.04] text-white/70 border-white/[0.08]',
  success: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
  danger: 'bg-rose-500/15 text-rose-200 border-rose-500/25',
  info: 'bg-blue-500/15 text-blue-200 border-blue-500/25',
} as const

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: keyof typeof toneMap
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 border rounded-md',
        toneMap[tone],
        className
      )}
    >
      {children}
    </span>
  )
}


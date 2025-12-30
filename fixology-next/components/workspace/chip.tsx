'use client'

import { cn } from '@/lib/utils/cn'

export function Chip({
  children,
  muted,
  className,
}: {
  children: React.ReactNode
  muted?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border',
        muted ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white text-slate-700 border-slate-200',
        className
      )}
    >
      {children}
    </span>
  )
}


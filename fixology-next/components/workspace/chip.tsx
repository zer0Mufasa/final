'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

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
        muted ? 'bg-white/[0.04] text-white/70 border-white/10' : 'bg-white/[0.06] text-white/85 border-white/15',
        className
      )}
      style={{
        borderRadius: theme.radii.row,
      }}
    >
      {children}
    </span>
  )
}


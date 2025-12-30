'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function Surface({
  className,
  padding = 'p-4',
  children,
}: {
  className?: string
  padding?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('rounded-2xl border', padding, className)}
      style={{
        background: theme.colors.surface,
        borderColor: theme.colors.border,
        boxShadow: theme.shadows.sm,
      }}
    >
      {children}
    </div>
  )
}


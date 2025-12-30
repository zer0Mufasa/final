'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function GlassPanel({
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
      className={cn('border', padding, className)}
      style={{
        background: theme.surfaces.panel,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.panel,
        boxShadow: theme.shadows.sm,
      }}
    >
      {children}
    </div>
  )
}


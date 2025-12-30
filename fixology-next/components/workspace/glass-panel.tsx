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
      className={cn('rounded-2xl border', padding, className)}
      style={{
        background: theme.surfaces.panel,
        borderColor: theme.borders.hairline,
        boxShadow: theme.shadows.sm,
        backdropFilter: `blur(${theme.blur.md})`,
      }}
    >
      {children}
    </div>
  )
}


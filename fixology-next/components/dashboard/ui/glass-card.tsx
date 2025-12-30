'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function GlassCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'glass-card transition-all duration-150',
        className
      )}
      style={{
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.md,
        boxShadow: theme.shadows.sm,
        backdropFilter: `blur(${theme.blur.md})`,
      }}
    >
      {children}
    </div>
  )
}



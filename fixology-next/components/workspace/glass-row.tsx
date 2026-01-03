'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

interface GlassRowProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
  interactive?: boolean
}

export function GlassRow({
  className,
  children,
  interactive = true,
  ...props
}: GlassRowProps) {
  return (
    <div
      {...props}
      className={cn(
        'border flex items-center gap-3 px-4 py-3',
        interactive && 'hover:bg-white/[0.05] transition',
        className
      )}
      style={{
        background: theme.surfaces.row,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.row,
        boxShadow: theme.shadows.sm,
      }}
    >
      {children}
    </div>
  )
}


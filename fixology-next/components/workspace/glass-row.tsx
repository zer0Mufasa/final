'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function GlassRow({
  className,
  children,
  interactive = true,
}: {
  className?: string
  children: React.ReactNode
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border flex items-center gap-3 px-4 py-3',
        interactive && 'hover:bg-white/[0.05] transition',
        className
      )}
      style={{
        background: theme.surfaces.row,
        borderColor: theme.borders.hairline,
        backdropFilter: `blur(${theme.blur.sm})`,
      }}
    >
      {children}
    </div>
  )
}


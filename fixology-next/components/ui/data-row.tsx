'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function DataRow({
  label,
  value,
  strong = false,
  className,
}: {
  label: string
  value: React.ReactNode
  strong?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between text-sm', className)}>
      <span style={{ color: strong ? theme.colors.text : theme.colors.muted, fontWeight: strong ? 700 : 500 }}>
        {label}
      </span>
      <span
        className={cn('tabular-nums')}
        style={{ color: strong ? theme.colors.text : theme.colors.text, fontWeight: strong ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  )
}


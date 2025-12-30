'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function SectionHeader({
  label,
  title,
  desc,
  right,
  className,
}: {
  label?: string
  title: string
  desc?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="space-y-1">
        {label ? <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">{label}</p> : null}
        <h2 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
          {title}
        </h2>
        {desc ? <p className="text-sm" style={{ color: theme.colors.muted }}>{desc}</p> : null}
      </div>
      {right}
    </div>
  )
}


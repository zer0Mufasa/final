'use client'

import { cn } from '@/lib/utils/cn'
import { GlassCard } from './glass-card'

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string
  value: string
  hint?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <GlassCard className={cn('p-5 rounded-3xl', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/45">
            {label}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {value}
          </div>
          {hint ? <div className="mt-1 text-sm text-white/55">{hint}</div> : null}
        </div>
        {icon ? (
          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/70">
            {icon}
          </div>
        ) : null}
      </div>
    </GlassCard>
  )
}



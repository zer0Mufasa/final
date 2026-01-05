'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function StatCard({
  label,
  value,
  subValue,
  icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  subValue?: string
  icon?: ReactNode
  tone?: 'default' | 'violet' | 'emerald' | 'amber' | 'rose'
}) {
  const toneStyles: Record<string, { bg: string; border: string; iconBg: string; iconBorder: string; iconText: string }> =
    {
      default: {
        bg: 'bg-white/[0.03]',
        border: 'border-white/[0.08]',
        iconBg: 'bg-white/[0.05]',
        iconBorder: 'border-white/[0.10]',
        iconText: 'text-white/70',
      },
      violet: {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        iconBg: 'bg-violet-500/20',
        iconBorder: 'border-violet-500/30',
        iconText: 'text-violet-200',
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/20',
        iconBorder: 'border-emerald-500/30',
        iconText: 'text-emerald-200',
      },
      amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        iconBg: 'bg-amber-500/20',
        iconBorder: 'border-amber-500/30',
        iconText: 'text-amber-200',
      },
      rose: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        iconBg: 'bg-rose-500/20',
        iconBorder: 'border-rose-500/30',
        iconText: 'text-rose-200',
      },
    }

  const s = toneStyles[tone] || toneStyles.default

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5',
        s.bg,
        s.border
      )}
      style={{ backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-white/45">{label}</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight text-white/95">{value}</div>
          {subValue ? <div className="mt-1 text-xs text-white/45">{subValue}</div> : null}
        </div>
        {icon ? (
          <div className={cn('p-2.5 rounded-xl border', s.iconBg, s.iconBorder, s.iconText)}>{icon}</div>
        ) : null}
      </div>
    </div>
  )
}


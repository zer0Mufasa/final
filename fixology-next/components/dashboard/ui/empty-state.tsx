'use client'

import { cn } from '@/lib/utils/cn'

export function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
}: {
  icon: React.ReactNode
  title: string
  description: string
  cta?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('text-center py-14', className)}>
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-5">
        <div className="text-white/45">{icon}</div>
      </div>
      <div className="text-lg font-semibold text-white/90">{title}</div>
      <div className="text-sm text-white/55 mt-1 max-w-md mx-auto leading-relaxed">{description}</div>
      {cta ? <div className="mt-6 flex items-center justify-center">{cta}</div> : null}
    </div>
  )
}



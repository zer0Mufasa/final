'use client'

import { cn } from '@/lib/utils/cn'

export function PageHeader({
  title,
  description,
  action,
  kicker,
  className,
}: {
  title: string
  description?: string
  kicker?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        {kicker ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-white/60 mb-2">
            {kicker}
          </div>
        ) : null}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm sm:text-base text-white/55 leading-relaxed max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  )
}



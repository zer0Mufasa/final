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
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6',
        className
      )}
    >
      <div className="min-w-0">
        {kicker ? (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-white/60 mb-2">
            {kicker}
          </div>
        ) : null}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white/95">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="w-full sm:w-auto sm:flex-shrink-0">{action}</div> : null}
    </div>
  )
}



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
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#f1f5f9] border border-[#e5e7eb] text-xs font-semibold text-[#6b7280] mb-2">
            {kicker}
          </div>
        ) : null}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm sm:text-base text-[#6b7280] leading-relaxed max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  )
}



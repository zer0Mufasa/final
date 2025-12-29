'use client'

import { cn } from '@/lib/utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/[0.06] border border-white/10',
        className
      )}
    />
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-2/3' : i === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  )
}



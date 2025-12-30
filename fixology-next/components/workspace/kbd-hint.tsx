'use client'

import { cn } from '@/lib/utils/cn'

export function KbdHint({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-white/50', className)}>
      {keys.map((k) => (
        <kbd key={k} className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[11px]">
          {k}
        </kbd>
      ))}
    </span>
  )
}


'use client'

import { cn } from '@/lib/utils/cn'

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-semibold text-white/60',
        className
      )}
    >
      {children}
    </kbd>
  )
}


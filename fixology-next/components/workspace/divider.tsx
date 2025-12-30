'use client'

import { cn } from '@/lib/utils/cn'

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-slate-200', className)} />
}


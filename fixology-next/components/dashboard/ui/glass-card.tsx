'use client'

import { cn } from '@/lib/utils/cn'

export function GlassCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('glass-card bg-white/[0.04] border-white/10 hover:-translate-y-0 hover:shadow-none', className)}>{children}</div>
}



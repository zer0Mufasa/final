'use client'

import { cn } from '@/lib/utils/cn'

export type PaymentState = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUND'

const tone: Record<PaymentState, string> = {
  UNPAID: 'bg-red-500/15 text-red-200 border border-red-500/25',
  PARTIAL: 'bg-amber-500/15 text-amber-200 border border-amber-500/25',
  PAID: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/25',
  REFUND: 'bg-blue-500/15 text-blue-200 border border-blue-500/25',
}

export function PaymentStatusPill({ state }: { state: PaymentState }) {
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1', tone[state])}>
      {state}
    </span>
  )
}


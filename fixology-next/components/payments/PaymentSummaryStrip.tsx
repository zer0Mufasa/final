'use client'

import { PaymentState, PaymentStatusPill } from './PaymentStatusPill'
import { Button } from '@/components/ui/button'

export function PaymentSummaryStrip({
  balance,
  paid,
  deposit,
  state,
  onCollect,
  onSendInvoice,
  onRefund,
}: {
  balance: string
  paid: string
  deposit?: string
  state: PaymentState
  onCollect?: () => void
  onSendInvoice?: () => void
  onRefund?: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <PaymentStatusPill state={state} />
        <div className="text-sm text-white/70">Balance due</div>
        <div className="text-lg font-bold text-white">{balance}</div>
        <div className="text-xs text-white/50">Paid {paid}</div>
        {deposit && <div className="text-xs text-white/50">Deposit: {deposit}</div>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onCollect}>
          Take payment
        </Button>
        <button className="btn-secondary px-3 py-2 rounded-xl text-sm" onClick={onSendInvoice}>
          Send invoice
        </button>
        <button className="btn-secondary px-3 py-2 rounded-xl text-sm" onClick={onRefund}>
          Refund
        </button>
      </div>
    </div>
  )
}


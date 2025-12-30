'use client'

import { useMemo, useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { LineItemsList, LineItem } from './LineItemsList'
import { PaymentMethodButtons } from './PaymentMethodButtons'
import { ReceiptPreview } from './ReceiptPreview'

export function CheckoutDrawer({
  open,
  onClose,
  ticket,
  customer,
  lineItems,
}: {
  open: boolean
  onClose: () => void
  ticket: string
  customer: string
  lineItems: LineItem[]
}) {
  const [method, setMethod] = useState('cash')
  const [complete, setComplete] = useState(false)

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, l) => s + l.qty * l.price, 0)
    const tax = Math.round(subtotal * 0.08 * 100) / 100
    return { subtotal, tax, total: subtotal + tax }
  }, [lineItems])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm flex items-start justify-end">
      <div className="w-full max-w-4xl h-full bg-[#0c0b12]/95 border-l border-white/10 shadow-2xl shadow-purple-500/30 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-xs text-white/50">Collect Payment</p>
            <p className="text-lg font-semibold text-white">Ticket {ticket} • {customer}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">What they’re paying for</p>
                <button className="text-xs text-white/60 underline underline-offset-4">AI Pricing Explainer</button>
              </div>
              <div className="mt-3">
                <LineItemsList items={lineItems} />
              </div>
              <div className="mt-3 text-sm text-white/60 space-y-1">
                <p>Add discount (UI only)</p>
                <p>Add tax (UI only)</p>
                <p>Tip toggle (UI only)</p>
                <p>Deposit option (UI only)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <p className="text-sm font-semibold text-white">Payment method</p>
              <PaymentMethodButtons value={method} onChange={setMethod} />
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white/70">
                {method === 'cash' && (
                  <>
                    <p className="font-semibold text-white">Cash</p>
                    <p className="text-xs text-white/50 mt-1">Enter amount received; change due will be shown here (UI-only).</p>
                  </>
                )}
                {method === 'card' && (
                  <>
                    <p className="font-semibold text-white">Card</p>
                    <p className="text-xs text-white/50 mt-1">Placeholder for terminal/Stripe flow (UI-only).</p>
                  </>
                )}
                {method === 'zelle' && (
                  <>
                    <p className="font-semibold text-white">Zelle</p>
                    <p className="text-xs text-white/50 mt-1">Paid to: ______ • Add reference note (UI-only).</p>
                  </>
                )}
                {method === 'cashapp' && (
                  <>
                    <p className="font-semibold text-white">Cash App</p>
                    <p className="text-xs text-white/50 mt-1">Handle / reference note (UI-only).</p>
                  </>
                )}
                {method === 'apple' && (
                  <>
                    <p className="font-semibold text-white">Apple Pay</p>
                    <p className="text-xs text-white/50 mt-1">Tap to pay placeholder (UI-only).</p>
                  </>
                )}
                {method === 'other' && (
                  <>
                    <p className="font-semibold text-white">Other</p>
                    <p className="text-xs text-white/50 mt-1">Provider dropdown + note (UI-only).</p>
                  </>
                )}
              </div>
            </div>

            <ReceiptPreview items={lineItems} tax={totals.tax} paid={complete ? totals.total : 0} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-white/60">Creates audit log + receipt automatically (UI only).</div>
          <div className="flex items-center gap-2">
            {!complete ? (
              <>
                <button className="btn-secondary px-4 py-2 rounded-xl text-sm" onClick={() => setComplete(true)}>Mark as paid</button>
                <button className="btn-primary px-4 py-2 rounded-xl text-sm" onClick={() => setComplete(true)}>Complete payment</button>
              </>
            ) : (
              <div className="flex items-center gap-3 text-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Payment received • ${totals.total.toFixed(2)} via {method}
                <button className="btn-secondary px-3 py-2 rounded-xl text-sm" onClick={onClose}>Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


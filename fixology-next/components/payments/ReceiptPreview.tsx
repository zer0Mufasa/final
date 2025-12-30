'use client'

import { LineItem } from './LineItemsList'

export function ReceiptPreview({
  shop = 'Fixology Demo Shop',
  ticket = 'TCK-2408',
  items,
  tax = 0,
  discount = 0,
  paid = 0,
}: {
  shop?: string
  ticket?: string
  items: LineItem[]
  tax?: number
  discount?: number
  paid?: number
}) {
  const subtotal = items.reduce((s, l) => s + l.qty * l.price, 0)
  const total = subtotal + tax - discount
  const balance = total - paid

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      <div className="flex items-center justify-between text-sm text-white/80">
        <p className="font-semibold text-white">{shop}</p>
        <p className="text-white/60">Ticket {ticket}</p>
      </div>
      <div className="space-y-1 text-sm text-white/75">
        {items.map((l) => (
          <div key={l.name} className="flex items-center justify-between">
            <span>{l.qty}× {l.name}</span>
            <span>${(l.qty * l.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-white/10 text-sm text-white/70 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>- ${discount.toFixed(2)}</span></div>}
        <div className="flex justify-between font-semibold text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
        <div className="flex justify-between text-emerald-200"><span>Paid</span><span>${paid.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold"><span>Balance</span><span>${balance.toFixed(2)}</span></div>
      </div>
    </div>
  )
}


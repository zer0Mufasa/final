'use client'

import { Info } from 'lucide-react'

export type LineItem = { name: string; qty: number; price: number; note?: string }

export function LineItemsList({ items }: { items: LineItem[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 text-white/80 text-sm">
            <Info className="w-4 h-4 text-white/50 mt-0.5" />
            <div>
              <p className="font-semibold text-white">{item.qty}× {item.name}</p>
              {item.note && <p className="text-white/60 text-xs">{item.note}</p>}
            </div>
          </div>
          <p className="text-white font-semibold">${(item.qty * item.price).toFixed(2)}</p>
        </div>
      ))}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <p className="text-white/70 font-semibold text-sm">Subtotal</p>
        <p className="text-lg font-bold text-white">
          $
          {items
            .reduce((s, l) => s + l.qty * l.price, 0)
            .toFixed(2)}
        </p>
      </div>
    </div>
  )
}


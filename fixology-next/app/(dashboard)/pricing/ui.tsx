'use client'

// app/(dashboard)/pricing/ui.tsx
// Quote builder and pricing confidence

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Eye, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export function PricingClient() {
  const [parts, setParts] = useState([{ name: 'iPhone 14 Pro Screen (OEM)', cost: 124, markup: 75, price: 217 }])
  const [labor, setLabor] = useState(95)
  const [warranty, setWarranty] = useState(30)

  const subtotal = parts.reduce((sum, p) => sum + p.price, 0) + labor
  const total = subtotal + warranty
  const margin = ((total - parts.reduce((sum, p) => sum + p.cost, 0) - labor * 0.3) / total) * 100

  return (
    <div>
      <PageHeader
        title="Pricing & Quotes"
        description="Build quotes with confidence — parts, labor, warranty, and margin clarity."
        action={<Button leftIcon={<CheckCircle2 className="w-4 h-4" />}>Create quote</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Quote builder */}
        <div className="space-y-6">
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Quote builder</div>
            </div>

            {/* Parts */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Parts</div>
              <div className="space-y-3">
                {parts.map((part, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{part.name}</div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">${part.price}</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>Cost: ${part.cost}</span>
                      <span>Markup: {part.markup}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Labor */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Labor</div>
              <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[var(--text-primary)]">Repair labor (2-3 hours)</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">${labor}</div>
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Warranty</div>
              <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[var(--text-primary)]">30-day warranty</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">${warranty}</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Market comparison */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Market comparison</div>
            </div>
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span>Your price</span>
                <span className="font-semibold text-[var(--text-primary)]">${total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Market average</span>
                <span className="text-[var(--text-muted)]">$245</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Competitive range</span>
                <span className="text-[var(--text-muted)]">$220 - $270</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
                UI only — market data will sync with pricing APIs
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Preview & confidence */}
        <div className="space-y-6">
          {/* Margin confidence */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Margin confidence</div>
            <div className="mb-4">
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{ width: `${Math.min(margin, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-sm font-bold text-green-300">{margin.toFixed(1)}% margin</div>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Healthy margin range: 40-60%</div>
          </GlassCard>

          {/* Customer preview */}
          <GlassCard className="p-6 rounded-3xl border-purple-400/30 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-purple-300" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">Explain to customer</div>
            </div>
            <div className="space-y-3 text-sm text-[var(--text-primary)]/80 leading-relaxed">
              <p>
                "The repair includes a new screen, professional installation, and a 30-day warranty covering parts and labor."
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                This preview helps staff explain pricing clearly and confidently.
              </p>
            </div>
          </GlassCard>

          {/* Breakdown */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Breakdown</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Parts</span>
                <span>${parts.reduce((sum, p) => sum + p.price, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Labor</span>
                <span>${labor}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Warranty</span>
                <span>${warranty}</span>
              </div>
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                <span className="text-base font-bold text-[var(--text-primary)]">Total</span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">${total}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


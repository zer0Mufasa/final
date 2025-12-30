'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const payouts = [
  { date: 'Today', amount: '$1,820.00', status: 'Pending', ref: 'DEP-7841' },
  { date: 'Yesterday', amount: '$2,140.00', status: 'Sent', ref: 'DEP-7838' },
  { date: 'Last week', amount: '$9,420.00', status: 'Sent', ref: 'DEP-7820' },
]

export function PayoutsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts / Deposits"
        description="Bank deposit timeline and reconciliation placeholder. UI-only — no banking logic."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {payouts.map((p) => (
          <GlassCard key={p.ref} className="p-4 rounded-2xl border border-white/10">
            <p className="text-sm font-semibold text-white">{p.amount}</p>
            <p className="text-xs text-white/50">{p.date}</p>
            <p className="text-xs text-white/60 mt-2">Ref: {p.ref}</p>
            <span className="mt-2 inline-flex px-2.5 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10">
              {p.status}
            </span>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <p className="text-sm font-semibold text-white mb-2">Reconciliation (UI)</p>
        <p className="text-sm text-white/70">Match deposits to tickets/invoices later. For now, this is a calm placeholder.</p>
      </GlassCard>
    </div>
  )
}


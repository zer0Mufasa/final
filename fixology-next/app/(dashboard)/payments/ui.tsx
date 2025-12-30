'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const paymentSummary = [
  { label: 'Collected today', value: '$4,280', sub: '+$320 vs yesterday' },
  { label: 'Pending payouts', value: '$1,120', sub: 'Expected <24h' },
  { label: 'Failed / disputes', value: '$0', sub: 'No action needed' },
]

const payments = [
  { id: 'INV-2381', customer: 'Jordan Lee', device: 'iPhone 14 Pro', amount: '$420', status: 'Paid', method: 'Card •••• 3204', time: 'Today 10:12a' },
  { id: 'INV-2380', customer: 'Priya Patel', device: 'Galaxy S23', amount: '$310', status: 'Pending', method: 'Card •••• 1190', time: 'Today 9:55a' },
  { id: 'INV-2379', customer: 'Sam Chen', device: 'PS5', amount: '$190', status: 'Paid', method: 'Card •••• 8341', time: 'Yesterday' },
  { id: 'INV-2378', customer: 'Alina Flores', device: 'MacBook Air', amount: '$620', status: 'Overdue', method: '—', time: '2 days ago' },
]

export function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track collected, pending, and failed payments. UI-only preview — no live processing yet."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Record payment</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paymentSummary.map((s) => (
          <GlassCard key={s.label} className="p-4 rounded-2xl border border-white/10">
            <p className="text-xs uppercase text-white/50">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-xs text-emerald-300/80 mt-1">{s.sub}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/70">Recent payments</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-sm border border-white/10">Filter</button>
            <button className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm shadow-lg shadow-purple-500/30">Export</button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {payments.map((p) => (
            <div key={p.id} className="py-3 grid grid-cols-6 items-center text-sm text-white/80">
              <div className="font-semibold text-white">{p.id}</div>
              <div>{p.customer}</div>
              <div className="text-white/60">{p.device}</div>
              <div className="font-semibold">{p.amount}</div>
              <div>
                <span
                  className={
                    p.status === 'Paid'
                      ? 'px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-200'
                      : p.status === 'Pending'
                        ? 'px-2 py-1 rounded-full text-xs bg-amber-500/15 text-amber-200'
                        : 'px-2 py-1 rounded-full text-xs bg-red-500/15 text-red-200'
                  }
                >
                  {p.status}
                </span>
              </div>
              <div className="text-right text-white/60">{p.method}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


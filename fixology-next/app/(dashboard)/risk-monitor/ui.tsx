'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const risks = [
  { label: 'Stolen / IMEI flagged', device: 'iPhone 14 Pro', customer: 'Unknown walk-in', severity: 'high', note: 'IMEI appears in watchlist' },
  { label: 'Repeat liquid damage', device: 'Galaxy S22', customer: 'Sam Chen', severity: 'medium', note: '3 prior liquid repairs in 60 days' },
  { label: 'Payment disputes', device: 'MacBook Air', customer: 'Jordan Lee', severity: 'medium', note: 'Chargeback last quarter' },
  { label: 'Overdue tickets', device: 'PS5', customer: 'Priya Patel', severity: 'low', note: 'Promise time exceeded by 1 day' },
]

export function RiskMonitorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Monitor"
        description="Flagged devices, customers, and patterns. UI-only — helps front desk avoid surprises."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Open playbook</button>}
      />

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="grid gap-3">
          {risks.map((r) => (
            <div
              key={r.label}
              className="p-3 rounded-2xl border border-white/10 bg-white/[0.03] flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">{r.label}</p>
                <p className="text-xs text-white/50">{r.device} • {r.customer}</p>
                <p className="text-xs text-white/60">{r.note}</p>
              </div>
              <span
                className={
                  r.severity === 'high'
                    ? 'px-2.5 py-1 rounded-full bg-red-500/15 text-red-200 text-xs font-semibold'
                    : r.severity === 'medium'
                      ? 'px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs font-semibold'
                      : 'px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-semibold'
                }
              >
                {r.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


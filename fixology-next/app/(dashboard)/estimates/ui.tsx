'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const estimates = [
  { id: 'EST-104', customer: 'Ari Kim', device: 'iPhone 15 Pro', est: '$420', status: 'Accepted', final: '$430' },
  { id: 'EST-103', customer: 'Diego Ruiz', device: 'Galaxy S23', est: '$320', status: 'Pending', final: '—' },
  { id: 'EST-102', customer: 'Mina Alvi', device: 'PS5', est: '$210', status: 'Expired', final: '—' },
  { id: 'EST-101', customer: 'Noah Smith', device: 'MacBook Air', est: '$640', status: 'Accepted', final: '$655' },
]

export function EstimatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimates"
        description="Present clean estimates before work begins. Track acceptance and compare estimated vs. final."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">New estimate</button>}
      />

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white/70">Recent estimates</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-sm border border-white/10">Filter</button>
            <button className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm shadow-lg shadow-purple-500/30">Export</button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          <div className="grid grid-cols-6 text-xs uppercase tracking-wide text-white/40 pb-2">
            <span>ID</span>
            <span>Customer</span>
            <span>Device</span>
            <span>Estimate</span>
            <span>Status</span>
            <span className="text-right">Final</span>
          </div>
          {estimates.map((e) => (
            <div key={e.id} className="py-3 grid grid-cols-6 items-center text-sm text-white/80">
              <div className="font-semibold text-white">{e.id}</div>
              <div>{e.customer}</div>
              <div className="text-white/60">{e.device}</div>
              <div className="font-semibold">{e.est}</div>
              <div>
                <span
                  className={
                    e.status === 'Accepted'
                      ? 'px-2 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-200'
                      : e.status === 'Pending'
                        ? 'px-2 py-1 rounded-full text-xs bg-amber-500/15 text-amber-200'
                        : 'px-2 py-1 rounded-full text-xs bg-white/5 text-white/60'
                  }
                >
                  {e.status}
                </span>
              </div>
              <div className="text-right font-semibold text-white/70">{e.final}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


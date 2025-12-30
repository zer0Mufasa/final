'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const cards = [
  { label: 'Avg repair time', value: '2h 15m', delta: '-12m vs last week' },
  { label: 'Revenue per device', value: '$182', delta: '+$9 vs last week' },
  { label: 'Repeat customers', value: '34%', delta: '+3 pts' },
  { label: 'Failed repairs', value: '1.8%', delta: '-0.4 pts' },
]

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        description="Owner-facing snapshot. Placeholder charts and AI callouts — no live data yet."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Share report</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-4 rounded-2xl border border-white/10">
            <p className="text-xs uppercase text-white/50">{c.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{c.value}</p>
            <p className="text-xs text-emerald-300/80 mt-1">{c.delta}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-4 rounded-2xl border border-white/10 lg:col-span-2">
          <p className="text-sm text-white/70 mb-2">Ticket volume (mock)</p>
          <div className="h-48 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-sm">
            Chart placeholder
          </div>
        </GlassCard>
        <GlassCard className="p-4 rounded-2xl border border-white/10">
          <p className="text-sm text-white/70 mb-2">AI Insight</p>
          <p className="text-white/80 text-sm">
            “Afternoons are slower by 18%. Offer same-day upsell before 1pm. Parts stockouts correlate with longer promise times.”
          </p>
        </GlassCard>
      </div>
    </div>
  )
}


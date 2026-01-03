'use client'

// app/(dashboard)/business-health/ui.tsx
// Revenue trends, repair mix, efficiency - owner view

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { StatCard } from '@/components/dashboard/ui/stat-card'
import { TrendingUp, DollarSign, Clock, Users } from 'lucide-react'

export function BusinessHealthClient() {
  return (
    <div>
      <PageHeader
        title="Business Health"
        description="Owner-level clarity — revenue trends, repair mix, customer return rate, operational efficiency."
      />

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Monthly revenue" value="$12,450" hint="+8% vs last month" icon={<DollarSign className="w-5 h-5" />} />
        <StatCard label="Avg repair time" value="2.4h" hint="Down 12%" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Customer return rate" value="24%" hint="Healthy range" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Efficiency score" value="87%" hint="Above average" icon={<TrendingUp className="w-5 h-5" />} />
      </div>

      {/* Repair mix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6 rounded-3xl">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Repair mix</div>
          <div className="space-y-3">
            {['Screen replacements (45%)', 'Battery replacements (30%)', 'Charge ports (15%)', 'Other (10%)'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6 rounded-3xl">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Profit health</div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div>Margin: 52% (Healthy)</div>
            <div>Labor efficiency: 85%</div>
            <div>Parts utilization: 78%</div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


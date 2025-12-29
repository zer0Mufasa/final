'use client'

// app/(dashboard)/risk/ui.tsx
// Risk dashboard - serious, not scary

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { RiskBadge } from '@/components/dashboard/ui/badge'
import { mockTickets } from '@/lib/mock/data'
import { AlertTriangle, Shield, History, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function RiskClient() {
  const highRiskTickets = mockTickets.filter((t) => t.risk === 'high' || t.risk === 'medium')
  const repeatCustomers = ['Jordan Lee', 'Maya Patel'] // Mock

  return (
    <div>
      <PageHeader
        title="Risk Center"
        description="Prevent losses before they happen — high-risk tickets, repeat patterns, and unusual activity."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* High-risk tickets */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6 rounded-3xl border-red-400/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-300" />
              <div className="text-sm font-semibold text-white/90">High-risk tickets</div>
            </div>
            <div className="space-y-3">
              {highRiskTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="block rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-white/90">{t.ticketNumber}</div>
                    <RiskBadge risk={t.risk} />
                  </div>
                  <div className="text-xs text-white/60">{t.customerName} • {t.device}</div>
                  <div className="mt-2 text-xs text-white/50">
                    Risk: {t.risk === 'high' ? 'Possible OLED damage expansion' : 'Water indicator needs verification'}
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>

          {/* Repeat customers */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Repeat customers</div>
            </div>
            <div className="space-y-2">
              {repeatCustomers.map((name) => (
                <div key={name} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="text-sm font-semibold text-white/90">{name}</div>
                  <div className="text-xs text-white/60 mt-1">3+ repairs in last 6 months</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Risk summary */}
        <div className="space-y-6">
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Risk summary</div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-white/50 mb-1">High risk tickets</div>
                <div className="text-2xl font-bold text-red-300">{highRiskTickets.filter((t) => t.risk === 'high').length}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Medium risk</div>
                <div className="text-2xl font-bold text-yellow-300">{highRiskTickets.filter((t) => t.risk === 'medium').length}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Repeat customers</div>
                <div className="text-2xl font-bold text-white">{repeatCustomers.length}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 rounded-3xl">
            <div className="text-sm font-semibold text-white/90 mb-3">Recommended actions</div>
            <div className="space-y-2 text-sm text-white/70">
              <div>• Review high-risk tickets before repair</div>
              <div>• Verify repeat customer device history</div>
              <div>• Check warranty status before starting</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


'use client'

// app/(dashboard)/warranty/ui.tsx
// Active warranties and coverage clarity

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Shield, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

const mockWarranties = [
  { id: '1', ticket: 'FIX-1041', customer: 'Jordan Lee', device: 'iPhone 14 Pro', expires: '2024-12-15', status: 'active' },
  { id: '2', ticket: 'FIX-1028', customer: 'Maya Patel', device: 'iPad Air', expires: '2024-11-20', status: 'active' },
]

export function WarrantyClient() {
  return (
    <div>
      <PageHeader
        title="Warranty & Liability"
        description="Active warranties, expiration timeline, and coverage clarity — protect the business legally."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active warranties */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Active warranties</div>
            </div>
            {mockWarranties.length === 0 ? (
              <EmptyState
                icon={<Shield className="w-8 h-8" />}
                title="No active warranties"
                description="Warranties will appear here as repairs are completed."
              />
            ) : (
              <div className="space-y-3">
                {mockWarranties.map((w) => (
                  <Link
                    key={w.id}
                    href={`/tickets/${w.ticket}`}
                    className="block rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-white/90">{w.ticket}</div>
                      <div className="px-2 py-1 rounded-lg bg-green-500/20 border border-green-400/30 text-xs text-green-300 font-semibold">
                        Active
                      </div>
                    </div>
                    <div className="text-sm text-white/70">{w.customer} • {w.device}</div>
                    <div className="text-xs text-white/50 mt-1">Expires {new Date(w.expires).toLocaleDateString()}</div>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Coverage clarity */}
        <div>
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-sm font-semibold text-white/90 mb-4">Coverage clarity</div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <div className="text-sm font-semibold text-white/90">Covered</div>
                </div>
                <div className="text-xs text-white/60 pl-6">Parts and labor defects</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-300" />
                  <div className="text-sm font-semibold text-white/90">Not covered</div>
                </div>
                <div className="text-xs text-white/60 pl-6">Accidental damage, water damage</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


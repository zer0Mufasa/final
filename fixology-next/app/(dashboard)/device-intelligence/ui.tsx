'use client'

// app/(dashboard)/device-intelligence/ui.tsx
// Device search and profile - IMEI, serial, model lookup

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Smartphone, Search, AlertTriangle, Shield, History } from 'lucide-react'
import { useState } from 'react'

export function DeviceIntelligenceClient() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div>
      <PageHeader
        title="Device Intelligence"
        description="Search by IMEI, serial, or model — see repair history, risks, and compatibility."
      />

      {/* Search */}
      <GlassCard className="p-6 rounded-3xl mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by IMEI, serial number, or model..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40 outline-none text-sm"
          />
        </div>
      </GlassCard>

      {!searchQuery ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<Smartphone className="w-8 h-8" />}
            title="Search for a device"
            description="Enter an IMEI, serial number, or model to view device history, risks, and compatibility."
          />
        </GlassCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Device profile */}
            <GlassCard className="p-6 rounded-3xl">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Device profile</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Model</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">iPhone 14 Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">IMEI</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">356938035643809</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Serial</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">F2LXN0C9Q1</span>
                </div>
              </div>
            </GlassCard>

            {/* Repair history */}
            <GlassCard className="p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-[var(--text-muted)]" />
                <div className="text-sm font-semibold text-[var(--text-primary)]">Repair history</div>
              </div>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <div>Screen replacement — 2 weeks ago</div>
                <div>Battery replacement — 3 months ago</div>
              </div>
            </GlassCard>
          </div>

          {/* Risk indicators */}
          <div className="space-y-6">
            <GlassCard className="p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-[var(--text-muted)]" />
                <div className="text-sm font-semibold text-[var(--text-primary)]">Risk indicators</div>
              </div>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <div>No flags detected</div>
                <div className="text-xs text-[var(--text-muted)] mt-2">UI only — will sync with IMEI checks</div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[var(--text-muted)]" />
                <div className="text-sm font-semibold text-[var(--text-primary)]">Warranty</div>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">No active warranty</div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}


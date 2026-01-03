'use client'

// app/(dashboard)/audit/ui.tsx
// Immutable-style log UI for accountability

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { FileCheck, Filter, Download } from 'lucide-react'
import { useState } from 'react'

const mockLogs = [
  { id: '1', action: 'Ticket created', user: 'Sofia Martinez', ticket: 'FIX-1041', time: 'Today, 9:42 AM' },
  { id: '2', action: 'Status changed', user: 'Ava Chen', ticket: 'FIX-1041', time: 'Today, 10:01 AM', from: 'INTAKE', to: 'DIAGNOSED' },
  { id: '3', action: 'Price updated', user: 'Noah Kim', ticket: 'FIX-1042', time: 'Today, 10:18 AM', from: '$149', to: '$179' },
]

export function AuditClient() {
  const [filter, setFilter] = useState('ALL')

  return (
    <div>
      <PageHeader
        title="Audit & Logs"
        description="Immutable action logs — every change is recorded for accountability and compliance."
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.04] border border-[var(--border-default)] px-3 py-2">
          <Filter className="w-4 h-4 text-[var(--text-primary)]/45" />
          <select
            className="bg-transparent text-sm text-[var(--text-primary)]/75 outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All actions</option>
            <option value="TICKET">Ticket changes</option>
            <option value="PRICE">Price changes</option>
            <option value="STATUS">Status changes</option>
          </select>
        </div>
        <button className="btn-secondary px-4 py-2 rounded-xl inline-flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export (UI)
        </button>
      </div>

      {/* Logs */}
      <GlassCard className="p-6 rounded-3xl">
        {mockLogs.length === 0 ? (
          <EmptyState
            icon={<FileCheck className="w-8 h-8" />}
            title="No logs yet"
            description="Action logs will appear here as changes are made to tickets and records."
          />
        ) : (
          <div className="space-y-3">
            {mockLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{log.action}</div>
                  <div className="text-xs text-[var(--text-muted)]">{log.time}</div>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">{log.user} • {log.ticket}</div>
                {log.from && log.to && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    {log.from} → {log.to}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}


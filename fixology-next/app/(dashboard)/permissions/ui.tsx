'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const matrix = [
  { feature: 'Create tickets', owner: true, tech: true, front: true },
  { feature: 'Edit pricing', owner: true, tech: false, front: false },
  { feature: 'Apply discounts', owner: true, tech: true, front: false },
  { feature: 'Send invoices', owner: true, tech: true, front: true },
  { feature: 'Manage staff', owner: true, tech: false, front: false },
  { feature: 'View risk monitor', owner: true, tech: true, front: true },
]

export function PermissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Matrix of allowed actions per role. UI-only toggles to preview access control."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Adjust defaults</button>}
      />

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="grid grid-cols-4 text-xs uppercase tracking-wide text-white/40 pb-2">
          <span>Feature</span>
          <span className="text-center">Owner</span>
          <span className="text-center">Technician</span>
          <span className="text-center">Front Desk</span>
        </div>
        <div className="divide-y divide-white/5">
          {matrix.map((row) => (
            <div key={row.feature} className="py-3 grid grid-cols-4 items-center text-sm text-white/80">
              <div className="font-semibold text-white">{row.feature}</div>
              {[row.owner, row.tech, row.front].map((val, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  <span
                    className={
                      val
                        ? 'px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs'
                        : 'px-2 py-1 rounded-full bg-white/5 text-white/40 text-xs'
                    }
                  >
                    {val ? 'Allowed' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


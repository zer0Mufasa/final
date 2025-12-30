'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const activity = [
  { time: 'Today 10:05a', action: 'Ticket auto-filled', detail: 'Parsed intake text for iPhone 14 Pro cracked screen', actor: 'AI Intake' },
  { time: 'Today 9:48a', action: 'Price suggested', detail: 'Recommended $420 based on device + issue', actor: 'Pricing AI' },
  { time: 'Yesterday 4:22p', action: 'Inventory flagged', detail: 'Low stock: iPhone 14 Pro screens (<5)', actor: 'Inventory AI' },
  { time: 'Yesterday 3:10p', action: 'Risk noted', detail: 'Repeat liquid damage customer flagged', actor: 'Risk AI' },
]

export function AIActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Activity Log"
        description="Timeline of AI suggestions and automations. UI-only trail for accountability."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Filter</button>}
      />

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="relative pl-6 space-y-4">
          {activity.map((a, idx) => (
            <div key={a.time} className="relative">
              {idx !== activity.length - 1 && (
                <div className="absolute left-[7px] top-6 bottom-0 w-px bg-white/10" />
              )}
              <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span className="font-semibold text-white">{a.action}</span>
                  <span className="text-white/40 text-xs">{a.time}</span>
                </div>
                <p className="text-white/60 text-sm mt-1">{a.detail}</p>
                <p className="text-xs text-white/50 mt-1">Source: {a.actor}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


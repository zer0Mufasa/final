'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'

const sessions = [
  { tech: 'Riley Chen', ticket: '#2381', device: 'iPhone 14 Pro', start: '9:05a', end: '10:10a', duration: '1h 5m' },
  { tech: 'Priya Patel', ticket: '#2379', device: 'PS5', start: '9:20a', end: '10:45a', duration: '1h 25m' },
  { tech: 'Noah Smith', ticket: '#2378', device: 'MacBook Air', start: '8:50a', end: '10:30a', duration: '1h 40m' },
]

export function TimeTrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracking"
        description="UI-only view of technician time blocks. Capture clock-ins and repair sessions without backend yet."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Add time entry</button>}
      />

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="grid grid-cols-6 text-xs uppercase tracking-wide text-white/40 pb-2">
          <span>Technician</span>
          <span>Ticket</span>
          <span>Device</span>
          <span>Start</span>
          <span>End</span>
          <span className="text-right">Duration</span>
        </div>
        <div className="divide-y divide-white/5">
          {sessions.map((s) => (
            <div key={`${s.tech}-${s.ticket}`} className="py-3 grid grid-cols-6 items-center text-sm text-white/80">
              <div className="font-semibold text-white">{s.tech}</div>
              <div>{s.ticket}</div>
              <div className="text-white/60">{s.device}</div>
              <div>{s.start}</div>
              <div>{s.end}</div>
              <div className="text-right font-semibold">{s.duration}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


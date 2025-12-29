'use client'

// app/(dashboard)/integrations/ui.tsx
// Integration cards - status previews only

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Plug, CheckCircle2, Clock, XCircle } from 'lucide-react'

const integrations = [
  { name: 'Payments', status: 'connected', desc: 'Stripe, Square' },
  { name: 'Accounting', status: 'available', desc: 'QuickBooks, Xero' },
  { name: 'SMS', status: 'available', desc: 'Twilio, MessageBird' },
  { name: 'Suppliers', status: 'coming_soon', desc: 'Auto-ordering' },
]

const statusConfig = {
  connected: { icon: <CheckCircle2 className="w-5 h-5 text-green-300" />, label: 'Connected', bg: 'bg-green-500/10 border-green-400/30' },
  available: { icon: <Clock className="w-5 h-5 text-blue-300" />, label: 'Available', bg: 'bg-blue-500/10 border-blue-400/30' },
  coming_soon: { icon: <XCircle className="w-5 h-5 text-white/30" />, label: 'Coming Soon', bg: 'bg-white/5 border-white/10' },
}

export function IntegrationsClient() {
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Future-proof confidence — payment, accounting, SMS, and supplier integrations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((int) => {
          const config = statusConfig[int.status as keyof typeof statusConfig]
          return (
            <GlassCard key={int.name} className={`p-6 rounded-3xl ${config.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <Plug className="w-5 h-5 text-white/50" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/90">{int.name}</div>
                  <div className="text-xs text-white/50">{int.desc}</div>
                </div>
                {config.icon}
              </div>
              <div className="text-xs font-semibold text-white/60">{config.label}</div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}


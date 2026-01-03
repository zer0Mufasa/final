'use client'

// app/(dashboard)/integrations/ui.tsx
// Integration cards - status previews only

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Plug, CheckCircle2, Clock, XCircle } from 'lucide-react'

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

const integrations = [
  { name: 'Payments', status: 'connected', desc: 'Stripe, Square' },
  { name: 'Accounting', status: 'available', desc: 'QuickBooks, Xero' },
  { name: 'SMS', status: 'available', desc: 'Twilio, MessageBird' },
  { name: 'Suppliers', status: 'coming_soon', desc: 'Auto-ordering' },
]

const statusConfig = {
  connected: { icon: <CheckCircle2 className="w-5 h-5 text-green-300" />, label: 'Connected', bg: 'bg-green-500/10 border-green-400/30' },
  available: { icon: <Clock className="w-5 h-5 text-blue-300" />, label: 'Available', bg: 'bg-blue-500/10 border-blue-400/30' },
  coming_soon: { icon: <XCircle className="w-5 h-5 text-[var(--text-primary)]/30" />, label: 'Coming Soon', bg: 'bg-white/5 border-[var(--border-default)]' },
}

export function IntegrationsClient() {
  const [animationReady, setAnimationReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimationReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Integrations"
          description="Future-proof confidence — payment, accounting, SMS, and supplier integrations."
        />
      </div>

      <div className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {integrations.map((int, index) => {
          const config = statusConfig[int.status as keyof typeof statusConfig]
          return (
            <GlassCard 
              key={int.name} 
              className={cn(
                "p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group",
                config.bg
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Plug className="w-5 h-5 text-[var(--text-muted)] group-hover:text-purple-400 transition-colors" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{int.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{int.desc}</div>
                </div>
                {config.icon}
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)]/60">{config.label}</div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}


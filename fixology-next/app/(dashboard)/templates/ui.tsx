'use client'

// app/(dashboard)/templates/ui.tsx
// Intake, diagnostic, pricing, and message templates

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { FileCode, Plus, ClipboardList, Stethoscope, DollarSign, MessageSquare } from 'lucide-react'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { useState } from 'react'

const mockTemplates = {
  intake: ['Standard intake', 'Quick intake', 'Warranty claim'],
  diagnostic: ['Screen test', 'Battery test', 'Charge port test'],
  pricing: ['Screen replacement', 'Battery replacement', 'Charge port repair'],
  message: ['Repair ready', 'Estimate sent', 'Parts delayed'],
}

export function TemplatesClient() {
  const [tab, setTab] = useState('intake')

  return (
    <div>
      <PageHeader
        title="Templates & Presets"
        description="Speed up operations — intake, diagnostic, pricing, and message templates."
        action={<button className="btn-primary px-4 py-2.5 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" />New template</button>}
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'intake', label: 'Intake' },
          { value: 'diagnostic', label: 'Diagnostic' },
          { value: 'pricing', label: 'Pricing' },
          { value: 'message', label: 'Message' },
        ]}
        className="mb-6"
      />

      <GlassCard className="p-6 rounded-3xl">
        {mockTemplates[tab as keyof typeof mockTemplates].length === 0 ? (
          <EmptyState
            icon={<FileCode className="w-8 h-8" />}
            title="No templates yet"
            description={`Create your first ${tab} template to speed up operations.`}
          />
        ) : (
          <div className="space-y-3">
            {mockTemplates[tab as keyof typeof mockTemplates].map((name) => (
              <div key={name} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors cursor-pointer">
                <div className="text-sm font-semibold text-white/90">{name}</div>
                <div className="text-xs text-white/50 mt-1">Click to edit or use</div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}


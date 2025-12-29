'use client'

// app/(dashboard)/training/ui.tsx
// Safe sandbox for training new staff

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { GraduationCap, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export function TrainingClient() {
  const [trainingMode, setTrainingMode] = useState(false)

  return (
    <div>
      <PageHeader
        title="Training Mode"
        description="Onboard staff safely — fake tickets clearly labeled, guided hints, safe sandbox."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Training mode toggle */}
        <GlassCard className="p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Training mode</div>
            </div>
            <button
              onClick={() => setTrainingMode(!trainingMode)}
              className="flex items-center gap-2"
            >
              {trainingMode ? (
                <ToggleRight className="w-10 h-10 text-green-400" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-white/30" />
              )}
            </button>
          </div>
          <div className="text-sm text-white/70">
            {trainingMode
              ? 'Training mode is active. All tickets are fake and clearly labeled.'
              : 'Enable training mode to practice with fake data.'}
          </div>
        </GlassCard>

        {/* Progress */}
        <GlassCard className="p-6 rounded-3xl">
          <div className="text-sm font-semibold text-white/90 mb-4">Training progress</div>
          <div className="space-y-3">
            {['Create a ticket', 'Move ticket to next stage', 'Send customer update', 'Create invoice'].map((item, i) => (
              <div key={item} className="flex items-center gap-3">
                {i < 2 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                )}
                <div className={cn('text-sm', i < 2 ? 'text-white/70' : 'text-white/50')}>{item}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}


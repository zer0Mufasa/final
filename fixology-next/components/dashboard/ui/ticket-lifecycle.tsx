'use client'

// components/dashboard/ui/ticket-lifecycle.tsx
// Ticket journey visualization: Intake → Diagnosis → Approval → Repair → Ready → Pickup

import { GlassCard } from './glass-card'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type LifecycleStage = 'intake' | 'diagnosis' | 'approval' | 'repair' | 'ready' | 'pickup'

interface Stage {
  key: LifecycleStage
  label: string
  avgTime: string
  commonDelays: string[]
  requiredFields: string[]
}

const stages: Stage[] = [
  {
    key: 'intake',
    label: 'Intake',
    avgTime: '5 min',
    commonDelays: ['Missing device info', 'No customer contact'],
    requiredFields: ['Customer name', 'Device type', 'Issue description'],
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    avgTime: '15 min',
    commonDelays: ['Device won\'t power on', 'Need passcode'],
    requiredFields: ['Diagnostic results', 'Cause identified'],
  },
  {
    key: 'approval',
    label: 'Approval',
    avgTime: '2 hours',
    commonDelays: ['Customer not responding', 'Price concerns'],
    requiredFields: ['Estimate sent', 'Customer approval'],
  },
  {
    key: 'repair',
    label: 'Repair',
    avgTime: '2 hours',
    commonDelays: ['Waiting on parts', 'Complex issue'],
    requiredFields: ['Parts allocated', 'Repair started'],
  },
  {
    key: 'ready',
    label: 'Ready',
    avgTime: '30 min',
    commonDelays: ['Final QA pending', 'Accessories missing'],
    requiredFields: ['Repair complete', 'QA passed'],
  },
  {
    key: 'pickup',
    label: 'Pickup',
    avgTime: '10 min',
    commonDelays: ['Customer late', 'Payment issue'],
    requiredFields: ['Payment received', 'Device returned'],
  },
]

interface TicketLifecycleProps {
  currentStage: LifecycleStage
  completedStages?: LifecycleStage[]
  className?: string
}

export function TicketLifecycle({ currentStage, completedStages = [], className }: TicketLifecycleProps) {
  const currentIndex = stages.findIndex((s) => s.key === currentStage)
  const stage = stages[currentIndex]

  return (
    <GlassCard className={cn('p-6 rounded-3xl', className)}>
      <div className="text-sm font-semibold text-white/90 mb-4">Ticket journey</div>

      {/* Stage timeline */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between">
          {stages.map((s, i) => {
            const isCompleted = completedStages.includes(s.key) || i < currentIndex
            const isCurrent = s.key === currentStage
            const isPast = i < currentIndex

            return (
              <div key={s.key} className="flex flex-col items-center flex-1 relative">
                {/* Connector line */}
                {i < stages.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-5 left-[50%] w-full h-0.5',
                      isPast ? 'bg-purple-400/50' : 'bg-white/10',
                      'z-0'
                    )}
                    style={{ width: 'calc(100% - 20px)', marginLeft: 'calc(50% + 10px)' }}
                  />
                )}

                {/* Stage circle */}
                <div
                  className={cn(
                    'relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted
                      ? 'bg-purple-500/20 border-purple-400/50'
                      : isCurrent
                      ? 'bg-purple-500/30 border-purple-400 ring-4 ring-purple-400/20'
                      : 'bg-white/5 border-white/10'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-300" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 text-purple-300" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                  )}
                </div>

                {/* Stage label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-semibold',
                      isCurrent ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/40'
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current stage details */}
      {stage && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/90">Current: {stage.label}</div>
            <div className="text-xs text-white/50">Avg. {stage.avgTime}</div>
          </div>

          {stage.commonDelays.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-white/60 mb-1.5">Common delays</div>
              <div className="flex flex-wrap gap-1.5">
                {stage.commonDelays.map((delay) => (
                  <div
                    key={delay}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-xs text-amber-300"
                  >
                    {delay}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-white/60 mb-1.5">Required fields</div>
            <div className="space-y-1">
              {stage.requiredFields.map((field) => (
                <div key={field} className="flex items-center gap-2 text-xs text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}


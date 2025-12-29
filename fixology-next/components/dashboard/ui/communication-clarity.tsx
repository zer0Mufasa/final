'use client'

// components/dashboard/ui/communication-clarity.tsx
// Communication clarity score and note separation

import { GlassCard } from './glass-card'
import { MessageSquare, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

interface CommunicationClarityProps {
  score: number // 0-100
  customerNotes: string
  internalNotes: string
  tone?: 'neutral' | 'reassuring' | 'urgent'
  className?: string
}

export function CommunicationClarity({
  score,
  customerNotes,
  internalNotes,
  tone = 'neutral',
  className,
}: CommunicationClarityProps) {
  const [previewAsCustomer, setPreviewAsCustomer] = useState(false)

  const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
  const toneConfig = {
    neutral: { label: 'Neutral', color: 'text-white/60' },
    reassuring: { label: 'Reassuring', color: 'text-green-300' },
    urgent: { label: 'Urgent', color: 'text-red-300' },
  }

  return (
    <GlassCard className={cn('p-6 rounded-3xl', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white/50" />
          <div className="text-sm font-semibold text-white/90">Communication clarity</div>
        </div>
        <button
          onClick={() => setPreviewAsCustomer(!previewAsCustomer)}
          className="btn-secondary px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5"
        >
          {previewAsCustomer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {previewAsCustomer ? 'Internal view' : 'Preview as customer'}
        </button>
      </div>

      {/* Score meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-white/70">Clarity score</div>
          <div className={cn('text-sm font-bold', `text-${scoreColor}-300`)}>{score}%</div>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              scoreColor === 'green' && 'bg-gradient-to-r from-green-500 to-green-600',
              scoreColor === 'yellow' && 'bg-gradient-to-r from-yellow-500 to-yellow-600',
              scoreColor === 'red' && 'bg-gradient-to-r from-red-500 to-red-600'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        {score < 60 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertCircle className="w-3 h-3" />
            Low clarity — add more details
          </div>
        )}
      </div>

      {/* Notes separation */}
      <div className="space-y-3">
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-white/70">
              {previewAsCustomer ? 'Customer sees' : 'Customer notes'}
            </div>
            <div className={cn('text-xs font-medium', toneConfig[tone].color)}>{toneConfig[tone].label}</div>
          </div>
          <div className="text-sm text-white/80 leading-relaxed">{customerNotes || 'No customer notes'}</div>
        </div>

        {!previewAsCustomer && (
          <div className="rounded-2xl bg-purple-500/10 border border-purple-400/30 p-4">
            <div className="text-xs font-semibold text-purple-300 mb-2">Internal notes (not visible to customer)</div>
            <div className="text-sm text-white/70 leading-relaxed">{internalNotes || 'No internal notes'}</div>
          </div>
        )}
      </div>
    </GlassCard>
  )
}


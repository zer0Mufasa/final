'use client'

// components/dashboard/ui/autosave-indicator.tsx
// Autosave status indicator (UI-only)

import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type AutosaveStatus = 'saved' | 'saving' | 'error' | 'unsaved'

interface AutosaveIndicatorProps {
  status: AutosaveStatus
  lastSaved?: Date
  className?: string
}

export function AutosaveIndicator({ status, lastSaved, className }: AutosaveIndicatorProps) {
  if (status === 'saved') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-white/50', className)}>
        <CheckCircle2 className="w-3 h-3 text-green-400" />
        <span>Saved{lastSaved ? ` ${formatTime(lastSaved)}` : ''}</span>
      </div>
    )
  }

  if (status === 'saving') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-white/50', className)}>
        <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
        <span>Saving...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-xs text-red-300', className)}>
        <AlertCircle className="w-3 h-3" />
        <span>Save failed</span>
      </div>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs text-yellow-300', className)}>
      <AlertCircle className="w-3 h-3" />
      <span>Unsaved changes</span>
    </div>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)

  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


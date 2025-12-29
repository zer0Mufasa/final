'use client'

// components/dashboard/ui/decision-modal.tsx
// Contextual confirmation modals with checklists and explanations

import { Modal } from './modal'
import { CheckCircle2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface DecisionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  action: string
  onConfirm: () => void
  whatThisWillDo: string[]
  doubleCheck?: string[]
  warning?: string
  variant?: 'default' | 'warning' | 'danger'
}

export function DecisionModal({
  open,
  onOpenChange,
  title,
  description,
  action,
  onConfirm,
  whatThisWillDo,
  doubleCheck,
  warning,
  variant = 'default',
}: DecisionModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const variantStyles = {
    default: { border: 'border-purple-400/30', icon: 'text-purple-300' },
    warning: { border: 'border-yellow-400/30', icon: 'text-yellow-300' },
    danger: { border: 'border-red-400/30', icon: 'text-red-300' },
  }

  const styles = variantStyles[variant]

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} className="max-w-2xl">
      <div className="space-y-4">
        {/* What this will do */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
            <CheckCircle2 className={cn('w-4 h-4', styles.icon)} />
            What this will do
          </div>
          <ul className="space-y-2">
            {whatThisWillDo.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Double check */}
        {doubleCheck && doubleCheck.length > 0 && (
          <div className={cn('rounded-2xl border p-4', styles.border, 'bg-white/[0.02]')}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
              <AlertCircle className={cn('w-4 h-4', styles.icon)} />
              What to double-check
            </div>
            <ul className="space-y-2">
              {doubleCheck.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warning */}
        {warning && (
          <div className="rounded-2xl bg-red-500/10 border border-red-400/30 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">{warning}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={cn(
              variant === 'danger' && 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300',
              variant === 'warning' && 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-400/30 text-yellow-300'
            )}
          >
            {action}
          </Button>
        </div>
      </div>
    </Modal>
  )
}


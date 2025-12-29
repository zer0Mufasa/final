'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  side?: 'right' | 'left'
  className?: string
}) {
  const sideClasses =
    side === 'right'
      ? 'right-0 top-0 h-[100dvh] w-[92vw] max-w-[520px]'
      : 'left-0 top-0 h-[100dvh] w-[92vw] max-w-[520px]'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed z-[90] overflow-hidden',
            'bg-black/70 backdrop-blur-xl border border-white/10',
            'shadow-[0_30px_80px_rgba(0,0,0,0.6)]',
            sideClasses,
            className
          )}
        >
          <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-bold text-white/90">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-white/55 mt-1 leading-relaxed">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button className="btn-secondary px-3 py-2 rounded-xl" aria-label="Close">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="p-6 overflow-y-auto h-[calc(100dvh-88px)]">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}



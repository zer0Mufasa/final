'use client'

import { cn } from '@/lib/utils/cn'
import { X } from 'lucide-react'

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 420,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: number
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full bg-[#0a0a0e]/92 shadow-[0_30px_80px_rgba(0,0,0,0.60)] border-l border-white/[0.06] backdrop-blur-xl flex flex-col"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.12]"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
        <div className={cn('flex-1 overflow-y-auto p-4 space-y-4')}>{children}</div>
      </div>
    </div>
  )
}


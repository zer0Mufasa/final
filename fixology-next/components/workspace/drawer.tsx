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
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
        <div className={cn('flex-1 overflow-y-auto p-4 space-y-4')}>{children}</div>
      </div>
    </div>
  )
}


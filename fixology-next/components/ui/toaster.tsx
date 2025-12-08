'use client'

// components/ui/toaster.tsx
// Toast notification system

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// Global toast state
let toastListeners: Array<(toasts: Toast[]) => void> = []
let currentToasts: Toast[] = []

const updateToasts = (newToasts: Toast[]) => {
  currentToasts = newToasts
  toastListeners.forEach((listener) => listener(newToasts))
}

export const toast = {
  success: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    updateToasts([...currentToasts, { id, type: 'success', message, duration }])
  },
  error: (message: string, duration = 6000) => {
    const id = Math.random().toString(36).substr(2, 9)
    updateToasts([...currentToasts, { id, type: 'error', message, duration }])
  },
  warning: (message: string, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    updateToasts([...currentToasts, { id, type: 'warning', message, duration }])
  },
  info: (message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    updateToasts([...currentToasts, { id, type: 'info', message, duration }])
  },
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
}

const styles: Record<ToastType, string> = {
  success: 'border-l-green-500 bg-green-500/10',
  error: 'border-l-red-500 bg-red-500/10',
  warning: 'border-l-yellow-500 bg-yellow-500/10',
  info: 'border-l-blue-500 bg-blue-500/10',
}

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts([...newToasts])
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const removeToast = (id: string) => {
    updateToasts(currentToasts.filter((t) => t.id !== id))
  }

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration) {
        const timer = setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [toasts])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4',
            'bg-[rgb(var(--bg-card))] border border-[rgb(var(--border-subtle))]',
            'shadow-lg animate-slide-in-right',
            styles[t.type]
          )}
        >
          <span className={iconStyles[t.type]}>{icons[t.type]}</span>
          <span className="flex-1 text-sm text-[rgb(var(--text-primary))]">
            {t.message}
          </span>
          <button
            onClick={() => removeToast(t.id)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[rgb(var(--text-muted))]" />
          </button>
        </div>
      ))}
    </div>
  )
}


'use client'

// components/dashboard/ticket-card.tsx
// Compact ticket card for kanban board

import { Ticket, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState, useEffect } from 'react'

interface TicketCardProps {
  ticket: {
    id: string
    ticketNumber: string
    deviceBrand: string
    deviceModel?: string | null
    deviceType?: string | null
    customer: {
      firstName: string
      lastName: string
      phone?: string | null
    }
    status: string
    dueAt?: Date | null
    estimatedCost?: number | null
    isOverdue?: boolean
    isPinned?: boolean
    createdAt: Date
  }
  onClick?: () => void
  isSelected?: boolean
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const deviceDisplay = ticket.deviceModel || ticket.deviceType || 'Device'
  const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`
  const isOverdue = ticket.isOverdue || (ticket.dueAt && new Date(ticket.dueAt) < new Date())
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(ticket.createdAt))
  const [showTimer, setShowTimer] = useState(false)

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(ticket.createdAt))
    }, 60000)
    return () => clearInterval(interval)
  }, [ticket.createdAt])

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10',
        'cursor-pointer transition-all duration-200',
        'hover:bg-white/[0.06] hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10',
        'hover:-translate-y-1',
        isSelected && 'ring-2 ring-purple-500/50 border-purple-500/50',
        ticket.isPinned && 'border-yellow-500/30 bg-yellow-500/5'
      )}
    >
      {/* Pinned indicator */}
      {ticket.isPinned && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-400" />
      )}

      {/* Ticket number */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-white">{ticket.ticketNumber}</p>
        {isOverdue && (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            Overdue
          </span>
        )}
      </div>

      {/* Device */}
      <div className="flex items-center gap-2 mb-2">
        <Ticket className="w-3.5 h-3.5 text-purple-400" />
        <p className="text-xs text-white/90 font-medium truncate">
          {ticket.deviceBrand} {deviceDisplay}
        </p>
      </div>

      {/* Customer */}
      <p className="text-xs text-white/60 truncate mb-2">{customerName}</p>

      {/* Date and timer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
        <p className="text-xs text-white/50">{formatDate(ticket.createdAt)}</p>
        <div
          className="relative"
          onMouseEnter={() => setShowTimer(true)}
          onMouseLeave={() => setShowTimer(false)}
        >
          <div className="flex items-center gap-1 text-xs text-white/40 group-hover:text-white/60 transition-colors">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          {showTimer && (
            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 text-xs text-white/80 whitespace-nowrap z-10">
              Created {new Date(ticket.createdAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Estimated cost */}
      {ticket.estimatedCost && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-xs text-white/50">Est.</p>
          <p className="text-sm font-semibold text-green-400">${ticket.estimatedCost.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}


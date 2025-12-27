'use client'

// components/dashboard/ticket-card.tsx
// Compact ticket card for kanban board

import { Ticket, Phone, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
  }
  onClick?: () => void
  isSelected?: boolean
}

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const deviceDisplay = ticket.deviceModel || ticket.deviceType || 'Device'
  const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`
  const isOverdue = ticket.isOverdue || (ticket.dueAt && new Date(ticket.dueAt) < new Date())

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      INTAKE: 'border-blue-500/30 bg-blue-500/10',
      DIAGNOSED: 'border-purple-500/30 bg-purple-500/10',
      IN_PROGRESS: 'border-indigo-500/30 bg-indigo-500/10',
      READY: 'border-green-500/30 bg-green-500/10',
      PICKED_UP: 'border-gray-500/30 bg-gray-500/10',
    }
    return colors[status] || 'border-gray-500/30 bg-gray-500/10'
  }

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

      {/* Quick actions (show on hover) */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {ticket.customer.phone && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `tel:${ticket.customer.phone}`
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Call customer"
          >
            <Phone className="w-3.5 h-3.5 text-white/70" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Open message modal
          }}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title="Message customer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-white/70" />
        </button>
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


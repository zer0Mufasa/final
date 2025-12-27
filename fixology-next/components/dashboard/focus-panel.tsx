'use client'

// components/dashboard/focus-panel.tsx
// Right-side focus panel for ticket details

import { useState } from 'react'
import { Phone, Mail, MessageSquare, X, Ticket, Calendar, DollarSign, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Ticket {
  id: string
  ticketNumber: string
  deviceBrand: string
  deviceModel?: string | null
  deviceType?: string | null
  customer: {
    firstName: string
    lastName: string
    phone?: string | null
    email?: string | null
  }
  status: string
  dueAt?: Date | null
  estimatedCost?: number | null
  notes?: string | null
  createdAt: Date
}

interface FocusPanelProps {
  ticket: Ticket | null
  onClose?: () => void
  onStatusChange?: (status: string) => void
  onMessageSend?: (message: string) => void
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TodayOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Today</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-400">Ready for Pickup</p>
                <p className="text-xs text-white/60">3 repairs ready</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">Overdue</p>
                <p className="text-xs text-white/60">2 tickets need attention</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-400">Messages</p>
                <p className="text-xs text-white/60">5 pending replies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FocusPanel({ ticket, onClose, onStatusChange, onMessageSend }: FocusPanelProps) {
  const [message, setMessage] = useState('')

  if (!ticket) {
    return (
      <aside className="w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
        <TodayOverview />
      </aside>
    )
  }

  const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`
  const deviceDisplay = ticket.deviceModel || ticket.deviceType || 'Device'
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleSendMessage = () => {
    if (message.trim() && onMessageSend) {
      onMessageSend(message)
      setMessage('')
    }
  }

  return (
    <aside className="w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{ticket.ticketNumber}</h2>
          <p className="text-sm text-white/60">{ticket.deviceBrand} {deviceDisplay}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Ticket Details */}
      <div className="mb-6 space-y-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Ticket Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Status</p>
                <p className="text-sm font-semibold text-white">{formatStatus(ticket.status)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/50">Created</p>
                <p className="text-sm font-semibold text-white">{formatDateTime(ticket.createdAt)}</p>
              </div>
            </div>
            {ticket.dueAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50">Due Date</p>
                  <p className="text-sm font-semibold text-white">{formatDate(ticket.dueAt)}</p>
                </div>
              </div>
            )}
            {ticket.estimatedCost && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/50">Estimated Cost</p>
                  <p className="text-sm font-semibold text-green-400">${ticket.estimatedCost.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{customerName}</p>
              {ticket.customer.phone && (
                <p className="text-xs text-white/60">{ticket.customer.phone}</p>
              )}
              {ticket.customer.email && (
                <p className="text-xs text-white/60">{ticket.customer.email}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {ticket.customer.phone && (
              <button
                onClick={() => window.location.href = `tel:${ticket.customer.phone}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            )}
            {ticket.customer.email && (
              <button
                onClick={() => window.location.href = `mailto:${ticket.customer.email}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            )}
            <button
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/90"
            >
              <MessageSquare className="w-4 h-4" />
              Text
            </button>
          </div>
        </div>
      </div>

      {/* Message Update Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white/80 mb-3">Send Update to Customer</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message update here..."
          className="w-full h-32 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 resize-none text-sm"
        />
        <button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="mt-3 w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Update to Customer
        </button>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.10] transition-colors text-sm font-medium">
          View Full Ticket
        </button>
      </div>
    </aside>
  )
}


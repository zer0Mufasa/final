'use client'

// components/dashboard/focus-panel.tsx
// Right-side focus panel for ticket details

import { useState } from 'react'
import { Phone, Mail, MessageSquare, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
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
  onStatusChange?: (status: string) => void
  onNoteAdd?: (note: string) => void
}

const STATUS_TIMELINE = [
  { id: 'INTAKE', label: 'Intake', icon: <FileText className="w-4 h-4" /> },
  { id: 'DIAGNOSED', label: 'Diagnosed', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
  { id: 'READY', label: 'Ready', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'PICKED_UP', label: 'Picked Up', icon: <CheckCircle className="w-4 h-4" /> },
]

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_TIMELINE.findIndex((s) => s.id === currentStatus)

  return (
    <div className="space-y-3">
      {STATUS_TIMELINE.map((status, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = status.id === currentStatus

        return (
          <div key={status.id} className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                isCompleted
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/5 text-white/30 border border-white/10'
              )}
            >
              {status.icon}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCompleted ? 'text-white' : 'text-white/40'
                )}
              >
                {status.label}
              </p>
            </div>
            {isCurrent && (
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            )}
          </div>
        )
      })}
    </div>
  )
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

export function FocusPanel({ ticket, onStatusChange, onNoteAdd }: FocusPanelProps) {
  const [note, setNote] = useState('')

  if (!ticket) {
    return (
      <aside className="w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
        <TodayOverview />
      </aside>
    )
  }

  const customerName = `${ticket.customer.firstName} ${ticket.customer.lastName}`
  const deviceDisplay = ticket.deviceModel || ticket.deviceType || 'Device'

  return (
    <aside className="w-80 bg-black/30 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
      {/* Ticket header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">{ticket.ticketNumber}</h2>
        <p className="text-sm text-white/60">{ticket.deviceBrand} {deviceDisplay}</p>
      </div>

      {/* Customer contact */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
        <p className="text-sm font-semibold text-white mb-3">{customerName}</p>
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

      {/* Status timeline */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white/80 mb-4">Status Timeline</h3>
        <StatusTimeline currentStatus={ticket.status} />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white/80 mb-3">Notes</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full h-24 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 resize-none text-sm"
        />
        <button
          onClick={() => {
            if (note.trim() && onNoteAdd) {
              onNoteAdd(note)
              setNote('')
            }
          }}
          className="mt-2 w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
        >
          Add Note
        </button>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.10] transition-colors text-sm font-medium">
          View Full Ticket
        </button>
        <button className="w-full px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.10] transition-colors text-sm font-medium">
          Send Update to Customer
        </button>
      </div>
    </aside>
  )
}


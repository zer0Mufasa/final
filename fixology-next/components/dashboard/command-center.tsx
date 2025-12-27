'use client'

// components/dashboard/command-center.tsx
// Main command center layout with board and focus panel

import { useState, useEffect } from 'react'
import { TicketBoard } from './ticket-board'
import { FocusPanel } from './focus-panel'
import { LayoutGrid, List } from 'lucide-react'
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
  createdAt: Date | string
}

interface CommandCenterProps {
  tickets: Ticket[]
}

type ViewMode = 'board' | 'list'

export function CommandCenter({ tickets }: CommandCenterProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('board')

  // Load view mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-view-mode') as ViewMode | null
      if (saved === 'board' || saved === 'list') {
        setViewMode(saved)
      }
    }
  }, [])

  // Save view mode to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-view-mode', mode)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update selected ticket if it's the one being moved
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus })
        }
        // Refresh the page to get updated data
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error)
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Main board area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* View toggle */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              onClick={() => handleViewModeChange('board')}
              className={cn(
                'px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                viewMode === 'board'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                viewMode === 'list'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        {/* Board or List view */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'board' ? (
            <TicketBoard
              tickets={tickets}
              onTicketSelect={setSelectedTicket}
              selectedTicketId={selectedTicket?.id || null}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={cn(
                      'p-4 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer transition-all',
                      'hover:bg-white/[0.06] hover:border-purple-500/30',
                      selectedTicket?.id === ticket.id && 'ring-2 ring-purple-500/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{ticket.ticketNumber}</p>
                        <p className="text-sm text-white/60">
                          {ticket.deviceBrand} {ticket.deviceModel || ticket.deviceType}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {ticket.customer.firstName} {ticket.customer.lastName}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400">
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Focus panel */}
      <FocusPanel
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onStatusChange={(status) => {
          if (selectedTicket) {
            handleStatusChange(selectedTicket.id, status)
          }
        }}
        onMessageSend={async (message) => {
          // TODO: Send message to customer via API
          console.log('Send message to customer:', message)
          // For now, just show an alert
          alert(`Message would be sent: ${message}`)
        }}
      />
    </div>
  )
}


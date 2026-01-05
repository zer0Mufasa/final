'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { MessageSquare, Clock, AlertCircle, CheckCircle, Search, Filter, Eye, User, Store, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSupportClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    params.set('page', currentPage.toString())
    params.set('pageSize', '20')
    return `/api/admin/support?${params.toString()}`
  }, [statusFilter, priorityFilter, currentPage])

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher)
  const tickets = data?.tickets || []
  const stats = data?.stats || { open: 0, pending: 0, resolved: 0 }
  const totalCount = data?.totalCount || 0

  const filteredTickets = tickets.filter((ticket: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        ticket.ticketNumber.toLowerCase().includes(searchLower) ||
        ticket.customer?.name?.toLowerCase().includes(searchLower) ||
        ticket.customer?.email?.toLowerCase().includes(searchLower) ||
        ticket.deviceType?.toLowerCase().includes(searchLower) ||
        ticket.issueDescription?.toLowerCase().includes(searchLower) ||
        ticket.shop?.name?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INTAKE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'DIAGNOSED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'WAITING_PARTS':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'IN_PROGRESS':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      case 'READY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'PICKED_UP':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-rose-400'
      case 'HIGH':
        return 'text-amber-400'
      case 'NORMAL':
        return 'text-blue-400'
      case 'LOW':
        return 'text-gray-400'
      default:
        return 'text-white/60'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Support"
        description="Platform support tickets & escalations"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.open}</p>
              <p className="text-sm text-white/60">Open Tickets</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.pending}</p>
              <p className="text-sm text-white/60">Pending</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.resolved}</p>
              <p className="text-sm text-white/60">Resolved</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search tickets, customers, devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="">All Status</option>
            <option value="INTAKE">Intake</option>
            <option value="DIAGNOSED">Diagnosed</option>
            <option value="WAITING_PARTS">Waiting Parts</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READY">Ready</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </GlassCard>

      {/* Tickets List */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/[0.05] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-rose-400">Failed to load tickets.</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No tickets found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredTickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-semibold text-white/90">{ticket.ticketNumber}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusColor(ticket.status))}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={cn('text-xs font-medium', getPriorityColor(ticket.priority))}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/70 mb-2">
                      <span className="flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {ticket.shop?.name || 'Unknown Shop'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.customer?.name || 'Unknown Customer'}
                      </span>
                      {ticket.customer?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {ticket.customer.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mb-2 line-clamp-2">{ticket.issueDescription}</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>Device: {ticket.deviceBrand} {ticket.deviceType}</span>
                      <span>Created: {format(parseISO(ticket.createdAt), 'MMM d, yyyy')}</span>
                      {ticket.assignedTo && (
                        <span>Assigned: {ticket.assignedTo.name}</span>
                      )}
                    </div>
                    {selectedTicket === ticket.id && (
                      <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Shop:</span>
                            <Link
                              href={`/admin/shops/${ticket.shop?.id}`}
                              className="ml-2 text-purple-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ticket.shop?.name}
                            </Link>
                          </div>
                          <div>
                            <span className="text-white/60">Customer:</span>
                            <span className="ml-2 text-white/80">{ticket.customer?.name}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Email:</span>
                            <span className="ml-2 text-white/80">{ticket.customer?.email}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Phone:</span>
                            <span className="ml-2 text-white/80">{ticket.customer?.phone || 'N/A'}</span>
                          </div>
                          {ticket.estimatedCost && (
                            <div>
                              <span className="text-white/60">Est. Cost:</span>
                              <span className="ml-2 text-white/80">${ticket.estimatedCost}</span>
                            </div>
                          )}
                          {ticket.actualCost && (
                            <div>
                              <span className="text-white/60">Actual Cost:</span>
                              <span className="ml-2 text-white/80">${ticket.actualCost}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-white/60 mb-1">Issue Description:</p>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">{ticket.issueDescription}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open ticket detail modal
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="p-6 border-t border-white/[0.06] flex items-center justify-between">
            <div className="text-sm text-white/60">
              Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage * 20 >= totalCount}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

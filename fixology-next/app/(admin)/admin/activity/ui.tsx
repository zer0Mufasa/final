'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Activity, Filter, Search, ArrowRight, Store, User, CreditCard, Bell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminActivityClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', '50')
    params.set('page', currentPage.toString())
    if (typeFilter) params.set('type', typeFilter)
    return `/api/admin/stats/activity-feed?${params.toString()}`
  }, [typeFilter, currentPage])

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher)
  const events = data?.events || []
  const nextCursor = data?.nextCursor

  const filteredEvents = events.filter((event: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return event.title?.toLowerCase().includes(searchLower) || event.type?.toLowerCase().includes(searchLower)
    }
    return true
  })

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'shop_signup':
        return <Store className="w-4 h-4 text-emerald-400" />
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-blue-400" />
      case 'admin_action':
        return <User className="w-4 h-4 text-purple-400" />
      default:
        return <Bell className="w-4 h-4 text-white/40" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'shop_signup':
        return 'bg-emerald-500/10 border-emerald-500/20'
      case 'payment_received':
        return 'bg-blue-500/10 border-blue-500/20'
      case 'admin_action':
        return 'bg-purple-500/10 border-purple-500/20'
      default:
        return 'bg-white/[0.02] border-white/[0.06]'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Activity Feed"
        description="Platform-wide activity feed and events"
      />

      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="">All Types</option>
            <option value="shop_signup">Shop Signups</option>
            <option value="payment_received">Payments</option>
            <option value="admin_action">Admin Actions</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.05] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-rose-400">Failed to load activity feed.</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No activity found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredEvents.map((event: any) => (
              <Link
                key={event.id}
                href={event.link || '/admin/audit'}
                className="block p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', getEventColor(event.type))}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/85 mb-1">{event.title}</div>
                    <div className="text-xs text-white/50">{format(parseISO(event.timestamp), 'MMM d, yyyy h:mm a')}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {nextCursor && (
          <div className="p-6 border-t border-white/[0.06]">
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-full btn-secondary"
            >
              Load More
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

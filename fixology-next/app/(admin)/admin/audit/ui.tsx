'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import {
  ScrollText,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Store,
  User,
  Settings,
  Flag,
  Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface AuditLog {
  id: string
  action: string
  targetType: string
  targetId: string | null
  description: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function AdminAuditClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (actionFilter) params.set('action', actionFilter)
    if (targetTypeFilter) params.set('targetType', targetTypeFilter)
    params.set('page', currentPage.toString())
    params.set('pageSize', pageSize.toString())
    params.set('orderBy', 'createdAt')
    params.set('orderDir', 'desc')
    return `/api/admin/audit?${params.toString()}`
  }, [actionFilter, targetTypeFilter, currentPage, pageSize])

  const { data, error, isLoading, mutate } = useSWR<{ logs: AuditLog[]; totalCount: number }>(apiUrl, fetcher)
  const logs = data?.logs || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const getActionIcon = (action: string, targetType: string) => {
    if (action.includes('shop')) return <Store className="w-4 h-4" />
    if (action.includes('user')) return <User className="w-4 h-4" />
    if (action.includes('feature')) return <Flag className="w-4 h-4" />
    if (action.includes('announcement')) return <Megaphone className="w-4 h-4" />
    if (action.includes('admin')) return <Shield className="w-4 h-4" />
    return <Settings className="w-4 h-4" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-emerald-400'
    if (action.includes('update') || action.includes('toggle')) return 'text-blue-400'
    if (action.includes('delete')) return 'text-rose-400'
    if (action.includes('suspend')) return 'text-amber-400'
    if (action.includes('reactivate')) return 'text-purple-400'
    return 'text-white/60'
  }

  const filteredLogs = logs.filter((log) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.description?.toLowerCase().includes(searchLower) ||
        log.admin.email.toLowerCase().includes(searchLower) ||
        log.admin.name.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Audit Log"
        description="Track all platform admin actions and changes."
      />

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search actions, descriptions, admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          />
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="">All Types</option>
            <option value="shop">Shop</option>
            <option value="user">User</option>
            <option value="feature_flag">Feature Flag</option>
            <option value="announcement">Announcement</option>
            <option value="admin_auth">Admin Auth</option>
          </select>
        </div>
      </GlassCard>

      {/* Audit Logs */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white/90">
              {isLoading ? 'Loading...' : `${totalCount.toLocaleString()} Log Entries`}
            </h2>
            <p className="text-sm text-white/45">All admin actions tracked</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.05] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-rose-400">Failed to load audit logs.</div>
        ) : (
          <>
            <div className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-white/50">No audit logs found.</div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', getActionColor(log.action))}>
                        {getActionIcon(log.action, log.targetType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-sm font-medium', getActionColor(log.action))}>
                            {log.action}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-white/50">
                            {log.targetType}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{log.description || log.action}</p>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {log.admin.name} ({log.admin.role})
                          </span>
                          <span>{format(parseISO(log.createdAt), 'MMM d, yyyy h:mm a')}</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                        {selectedLog === log.id && log.metadata && (
                          <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                            <pre className="text-xs text-white/60 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.targetId && (
                          <div className="mt-2">
                            {log.targetType === 'shop' && (
                              <Link
                                href={`/admin/shops/${log.targetId}`}
                                className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Shop <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                            {log.targetType === 'user' && (
                              <Link
                                href={`/admin/users/${log.targetId}`}
                                className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View User <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-sm text-white/60">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white/80 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.08] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  )
}

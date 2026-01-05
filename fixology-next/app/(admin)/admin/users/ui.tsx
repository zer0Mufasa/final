'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import {
  Users,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  Mail,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  lastLoginAt: string | null
  createdAt: string
  shop: {
    id: string
    name: string
    slug: string
  }
}

export function AdminUsersClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (roleFilter !== 'All') params.set('role', roleFilter)
    if (statusFilter !== 'All') params.set('status', statusFilter)
    params.set('page', currentPage.toString())
    params.set('pageSize', pageSize.toString())
    params.set('orderBy', sortBy)
    params.set('orderDir', sortDir)
    return `/api/admin/users?${params.toString()}`
  }, [searchTerm, roleFilter, statusFilter, currentPage, pageSize, sortBy, sortDir])

  const { data, error, isLoading, mutate } = useSWR<{ users: User[]; totalCount: number }>(apiUrl, fetcher)
  const users = data?.users || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to toggle status')
      toast.success('User status updated')
      mutate()
      setActionMenuOpen(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status')
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Reset password for this user? A new password will be generated.')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to reset password')
      const data = await res.json()
      if (data.password) {
        toast.success(`Password reset! New password: ${data.password}`, { duration: 10000 })
      } else {
        toast.success('Password reset successfully')
      }
      mutate()
      setActionMenuOpen(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'INACTIVE':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'TECHNICIAN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Users"
        description="Manage all shop users across the platform."
      />

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="All">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="STAFF">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </GlassCard>

      {/* Users Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white/90">
              {isLoading ? 'Loading...' : `${totalCount.toLocaleString()} Users`}
            </h2>
            <p className="text-sm text-white/45">All users across all shops</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/[0.05] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-rose-400">Failed to load users.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left font-medium py-3 px-6 text-white/80">Name</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Email</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Shop</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Role</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Status</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Last Login</th>
                    <th className="text-left font-medium py-3 px-6 text-white/80">Created</th>
                    <th className="text-right font-medium py-3 px-6 text-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-white/50">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-6 font-semibold text-white/85">{user.name}</td>
                        <td className="py-3 px-6 text-white/70">{user.email}</td>
                        <td className="py-3 px-6">
                          <Link
                            href={`/admin/shops/${user.shop.id}`}
                            className="text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <Building2 className="w-3 h-3" />
                            {user.shop.name}
                          </Link>
                        </td>
                        <td className="py-3 px-6">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getRoleBadge(user.role))}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusBadge(user.status))}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-white/60">
                          {user.lastLoginAt ? format(parseISO(user.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                        </td>
                        <td className="py-3 px-6 text-white/60">
                          {format(parseISO(user.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-6">
                          <div className="relative flex justify-end">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white/80 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-xl z-10">
                                <button
                                  onClick={() => handleToggleStatus(user.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/[0.05] flex items-center gap-2"
                                >
                                  {user.status === 'ACTIVE' ? (
                                    <>
                                      <UserX className="w-4 h-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4" />
                                      Activate
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/[0.05] flex items-center gap-2"
                                >
                                  <Key className="w-4 h-4" />
                                  Reset Password
                                </button>
                                <Link
                                  href={`/admin/shops/${user.shop.id}`}
                                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/[0.05] flex items-center gap-2"
                                >
                                  <Building2 className="w-4 h-4" />
                                  View Shop
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

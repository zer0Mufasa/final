'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Search,
  Power,
  PowerOff,
  Info,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  targetAudience: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export function AdminAnnouncementsClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO',
    isActive: false,
    targetAudience: 'ALL',
    expiresAt: '',
  })

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (isActiveFilter !== '') params.set('isActive', isActiveFilter)
    return `/api/admin/announcements?${params.toString()}`
  }, [isActiveFilter])

  const { data, error, isLoading, mutate } = useSWR<{ announcements: Announcement[]; totalCount: number }>(apiUrl, fetcher)
  const announcements = data?.announcements || []

  const filteredAnnouncements = announcements.filter((ann) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        ann.title.toLowerCase().includes(searchLower) ||
        ann.content.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresAt: formData.expiresAt || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create announcement')
      toast.success('Announcement created')
      mutate()
      setIsCreating(false)
      setFormData({
        title: '',
        content: '',
        type: 'INFO',
        isActive: false,
        targetAudience: 'ALL',
        expiresAt: '',
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create announcement')
    }
  }

  const handleToggle = async (annId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${annId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle announcement')
      toast.success(`Announcement ${!currentActive ? 'activated' : 'deactivated'}`)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle announcement')
    }
  }

  const handleDelete = async (annId: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      const res = await fetch(`/api/admin/announcements/${annId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete announcement')
      toast.success('Announcement deleted')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete announcement')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-400" />
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-400" />
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      default:
        return <Info className="w-4 h-4 text-white/60" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Announcements"
        description="Manage platform announcements and banners."
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        }
      />

      {/* Create Modal */}
      {isCreating && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Create Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Announcement content (supports markdown)"
                rows={5}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                >
                  <option value="ALL">All Users</option>
                  <option value="TRIAL">Trial Users</option>
                  <option value="PAID">Paid Users</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500/20"
              />
              <label htmlFor="isActive" className="text-sm text-white/70">
                Active immediately
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary">
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setFormData({
                    title: '',
                    content: '',
                    type: 'INFO',
                    isActive: false,
                    targetAudience: 'ALL',
                    expiresAt: '',
                  })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </GlassCard>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <GlassCard key={i} className="h-32 animate-pulse">
              <div className="h-full" />
            </GlassCard>
          ))
        ) : error ? (
          <div className="text-rose-400">Failed to load announcements.</div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            No announcements found.
          </div>
        ) : (
          filteredAnnouncements.map((ann) => (
            <GlassCard key={ann.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(ann.type)}
                    <h3 className="text-lg font-semibold text-white/90">{ann.title}</h3>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getTypeColor(ann.type))}>
                      {ann.type}
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      ann.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    )}>
                      {ann.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-3 whitespace-pre-wrap">{ann.content}</p>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>Target: {ann.targetAudience}</span>
                    <span>Created: {format(parseISO(ann.createdAt), 'MMM d, yyyy')}</span>
                    {ann.expiresAt && (
                      <span>Expires: {format(parseISO(ann.expiresAt), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(ann.id, ann.isActive)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      ann.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    )}
                    title={ann.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {ann.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import {
  Flag,
  Plus,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Search,
  Power,
  PowerOff,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  isActive: boolean
  metadata: any
  createdAt: string
  updatedAt: string
}

export function AdminFeaturesClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    isActive: false,
  })

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (isActiveFilter !== '') params.set('isActive', isActiveFilter)
    return `/api/admin/features?${params.toString()}`
  }, [isActiveFilter])

  const { data, error, isLoading, mutate } = useSWR<{ flags: FeatureFlag[]; totalCount: number }>(apiUrl, fetcher)
  const flags = data?.flags || []

  const filteredFlags = flags.filter((flag) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        flag.key.toLowerCase().includes(searchLower) ||
        flag.name.toLowerCase().includes(searchLower) ||
        flag.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const handleCreate = async () => {
    if (!formData.key || !formData.name) {
      toast.error('Key and name are required')
      return
    }
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create feature flag')
      toast.success('Feature flag created')
      mutate()
      setIsCreating(false)
      setFormData({ key: '', name: '', description: '', isActive: false })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create feature flag')
    }
  }

  const handleToggle = async (flagId: string) => {
    try {
      const res = await fetch(`/api/admin/features/${flagId}/toggle`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to toggle feature flag')
      toast.success('Feature flag toggled')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle feature flag')
    }
  }

  const handleDelete = async (flagId: string) => {
    if (!confirm('Delete this feature flag?')) return
    try {
      const res = await fetch(`/api/admin/features/${flagId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete feature flag')
      toast.success('Feature flag deleted')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete feature flag')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Feature Flags"
        description="Manage platform-wide feature flags and rollouts."
        action={
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Flag
          </button>
        }
      />

      {/* Create Modal */}
      {isCreating && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Create Feature Flag</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Key</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="feature_key_name"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Feature Name"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
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
                Active by default
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary">
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setFormData({ key: '', name: '', description: '', isActive: false })
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
              placeholder="Search feature flags..."
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

      {/* Feature Flags List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <GlassCard key={i} className="h-32 animate-pulse" />
          ))
        ) : error ? (
          <div className="col-span-full text-rose-400">Failed to load feature flags.</div>
        ) : filteredFlags.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/50">
            No feature flags found.
          </div>
        ) : (
          filteredFlags.map((flag) => (
            <GlassCard key={flag.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className={cn('w-4 h-4', flag.isActive ? 'text-emerald-400' : 'text-gray-400')} />
                    <h3 className="font-semibold text-white/90">{flag.name}</h3>
                  </div>
                  <p className="text-xs text-white/50 font-mono mb-1">{flag.key}</p>
                  {flag.description && (
                    <p className="text-sm text-white/60 mt-2">{flag.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(flag.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    flag.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  )}
                  title={flag.isActive ? 'Deactivate' : 'Activate'}
                >
                  {flag.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  flag.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                )}>
                  {flag.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleDelete(flag.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Bookmark, Store, User, Ticket, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { SearchInput } from '@/components/admin/ui/search-input'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminBookmarksClient() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBookmark, setNewBookmark] = useState({ targetType: 'shop' as 'shop' | 'user' | 'ticket', targetId: '', label: '' })

  const { data: bookmarksData, mutate, error } = useSWR('/api/admin/bookmarks', fetcher)
  const bookmarks = bookmarksData?.bookmarks || []

  const filteredBookmarks = bookmarks.filter((b: any) =>
    b.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.targetId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddBookmark = async () => {
    if (!newBookmark.targetId) {
      toast.error('Target ID is required')
      return
    }

    try {
      const res = await fetch('/api/admin/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBookmark),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add bookmark')
      }

      toast.success('Bookmark added')
      setShowAddModal(false)
      setNewBookmark({ targetType: 'shop', targetId: '', label: '' })
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add bookmark')
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      const res = await fetch(`/api/admin/bookmarks/${bookmarkId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Bookmark removed')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bookmark')
    }
  }

  const getBookmarkIcon = (type: string) => {
    switch (type) {
      case 'shop':
        return <Store className="w-4 h-4" />
      case 'user':
        return <User className="w-4 h-4" />
      case 'ticket':
        return <Ticket className="w-4 h-4" />
      default:
        return <Bookmark className="w-4 h-4" />
    }
  }

  const getBookmarkUrl = (type: string, id: string) => {
    switch (type) {
      case 'shop':
        return `/admin/shops/${id}`
      case 'user':
        return `/admin/users/${id}`
      case 'ticket':
        return `/admin/support/${id}`
      default:
        return '#'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Bookmarks"
        description="Quick access to frequently accessed shops, users, and tickets."
        action={
          <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Bookmark
          </Button>
        }
      />

      <GlassCard>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search bookmarks..."
        />
      </GlassCard>

      {error ? (
        <GlassCard>
          <EmptyState
            icon={<Bookmark className="w-12 h-12 mx-auto opacity-30" />}
            title="Failed to load bookmarks"
            description="There was an error loading bookmarks. Please try again."
            action={<Button onClick={() => mutate()} variant="secondary">Retry</Button>}
          />
        </GlassCard>
      ) : filteredBookmarks.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Bookmark className="w-12 h-12 mx-auto opacity-30" />}
            title={searchTerm ? 'No bookmarks found' : 'No bookmarks'}
            description={searchTerm ? 'Try adjusting your search terms' : 'Add bookmarks for quick access to frequently used items'}
            action={
              !searchTerm && (
                <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                  Add Bookmark
                </Button>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBookmarks.map((bookmark: any) => (
            <GlassCard key={bookmark.id}>
              <Link href={getBookmarkUrl(bookmark.targetType, bookmark.targetId)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      {getBookmarkIcon(bookmark.targetType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90">
                        {bookmark.label || `${bookmark.targetType} ${bookmark.targetId.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs text-white/50 capitalize">{bookmark.targetType}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteBookmark(bookmark.id)
                    }}
                    tooltip="Remove bookmark"
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-white/50">
                  Added {format(parseISO(bookmark.createdAt), 'MMM d, yyyy')}
                </p>
              </Link>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setNewBookmark({ targetType: 'shop', targetId: '', label: '' })
        }}
        title="Add Bookmark"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Type</label>
            <select
              value={newBookmark.targetType}
              onChange={(e) => setNewBookmark({ ...newBookmark, targetType: e.target.value as any })}
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
            >
              <option value="shop">Shop</option>
              <option value="user">User</option>
              <option value="ticket">Ticket</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Target ID</label>
            <input
              type="text"
              value={newBookmark.targetId}
              onChange={(e) => setNewBookmark({ ...newBookmark, targetId: e.target.value })}
              placeholder="Enter ID"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Label (optional)</label>
            <input
              type="text"
              value={newBookmark.label}
              onChange={(e) => setNewBookmark({ ...newBookmark, label: e.target.value })}
              placeholder="Custom label"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddBookmark} className="flex-1">
              Add Bookmark
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                setNewBookmark({ targetType: 'shop', targetId: '', label: '' })
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

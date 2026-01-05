'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminApiKeysClient() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newKey, setNewKey] = useState({ name: '', permissions: [] as string[], rateLimit: '' })
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const { data: keysData, mutate, error } = useSWR('/api/admin/api-keys', fetcher)
  const keys = keysData?.keys || []

  const handleCreateKey = async () => {
    if (!newKey.name || newKey.permissions.length === 0) {
      toast.error('Name and at least one permission are required')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newKey,
          rateLimit: newKey.rateLimit ? parseInt(newKey.rateLimit) : null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const data = await res.json()
      setCreatedKey(data.key)
      toast.success('API key created! Copy it now - it won\'t be shown again.')
      setShowCreateModal(false)
      setNewKey({ name: '', permissions: [], rateLimit: '' })
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyKey = (keyPrefix: string, fullKey?: string) => {
    const textToCopy = fullKey || `fix_${keyPrefix}...`
    navigator.clipboard.writeText(textToCopy)
    toast.success('Copied to clipboard')
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Delete this API key? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('API key deleted')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete API key')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="API Keys"
        description="Manage platform API keys for integrations and external access."
        action={
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create API Key
          </Button>
        }
      />

      {error ? (
        <GlassCard>
          <EmptyState
            icon={<Key className="w-12 h-12 mx-auto opacity-30" />}
            title="Failed to load API keys"
            description="There was an error loading API keys. Please try again."
            action={<Button onClick={() => mutate()} variant="secondary">Retry</Button>}
          />
        </GlassCard>
      ) : keys.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<Key className="w-12 h-12 mx-auto opacity-30" />}
            title="No API keys"
            description="Create API keys to enable external integrations and programmatic access"
            action={
              <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Create API Key
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {keys.map((key: any) => (
            <GlassCard key={key.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white/90">{key.name}</h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        key.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      )}
                    >
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                    <span className="font-mono">fix_{key.keyPrefix}...</span>
                    <span>Permissions: {key.permissions.join(', ') || 'None'}</span>
                    {key.rateLimit && <span>Rate limit: {key.rateLimit}/min</span>}
                  </div>
                  <p className="text-xs text-white/50">
                    Created: {format(parseISO(key.createdAt), 'MMM d, yyyy')}
                    {key.lastUsedAt && ` • Last used: ${format(parseISO(key.lastUsedAt), 'MMM d')}`}
                    {key.expiresAt && ` • Expires: ${format(parseISO(key.expiresAt), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyKey(key.keyPrefix)}
                    tooltip="Copy key prefix"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    tooltip="Delete key"
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal || !!createdKey}
        onClose={() => {
          setShowCreateModal(false)
          setCreatedKey(null)
        }}
        title={createdKey ? 'API Key Created' : 'Create API Key'}
        size="md"
      >
        {createdKey ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-300 font-semibold mb-2">⚠️ Copy this key now!</p>
              <p className="text-xs text-white/60">This is the only time you'll see the full key.</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <code className="text-sm text-white/90 font-mono break-all">{createdKey}</code>
            </div>
            <Button
              onClick={() => handleCopyKey('', createdKey)}
              className="w-full"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copy Full Key
            </Button>
            <Button variant="secondary" onClick={() => setCreatedKey(null)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
              <input
                type="text"
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="Production API Key"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Permissions</label>
              <div className="space-y-2">
                {['read', 'write', 'admin'].map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={newKey.permissions.includes(perm)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKey({ ...newKey, permissions: [...newKey.permissions, perm] })
                        } else {
                          setNewKey({ ...newKey, permissions: newKey.permissions.filter((p) => p !== perm) })
                        }
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500/20"
                    />
                    {perm.charAt(0).toUpperCase() + perm.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Rate Limit (requests/min, optional)</label>
              <input
                type="number"
                value={newKey.rateLimit}
                onChange={(e) => setNewKey({ ...newKey, rateLimit: e.target.value })}
                placeholder="100"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateKey} isLoading={isCreating} className="flex-1">
                Create Key
              </Button>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

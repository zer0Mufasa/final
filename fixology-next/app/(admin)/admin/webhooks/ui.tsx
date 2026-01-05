'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Webhook, Plus, Power, PowerOff, Play, History, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { Modal } from '@/components/admin/ui/modal'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { SearchInput } from '@/components/admin/ui/search-input'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminWebhooksClient() {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'logs'>('outgoing')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] as string[], secret: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [isToggling, setIsToggling] = useState<string | null>(null)

  const { data: webhooksData, mutate, error } = useSWR('/api/admin/webhooks', fetcher)
  const webhooks = webhooksData?.webhooks || []

  const filteredWebhooks = webhooks.filter((w: any) =>
    w.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast.error('URL and at least one event are required')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create webhook')
      }

      toast.success('Webhook created successfully')
      setShowCreateModal(false)
      setNewWebhook({ url: '', events: [], secret: '' })
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create webhook')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleWebhook = async (webhookId: string, currentStatus: boolean) => {
    setIsToggling(webhookId)
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to toggle webhook')
      toast.success(`Webhook ${!currentStatus ? 'activated' : 'deactivated'}`)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle webhook')
    } finally {
      setIsToggling(null)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Delete this webhook? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/webhooks/${webhookId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete webhook')
      toast.success('Webhook deleted')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete webhook')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Webhooks Manager"
        description="Manage outgoing and incoming webhooks for integrations."
        action={
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Webhook
          </Button>
        }
      />

      {activeTab === 'outgoing' && (
        <GlassCard>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search webhooks by URL..."
            className="mb-4"
          />
        </GlassCard>
      )}

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['outgoing', 'incoming', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'outgoing' && (
        <div className="space-y-4">
          {error ? (
            <GlassCard>
              <div className="text-center py-12 text-rose-400">
                <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Failed to load webhooks. Please try again.</p>
                <Button onClick={() => mutate()} variant="secondary" className="mt-4">
                  Retry
                </Button>
              </div>
            </GlassCard>
          ) : filteredWebhooks.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={<Webhook className="w-12 h-12 mx-auto opacity-30" />}
                title={searchTerm ? 'No webhooks found' : 'No webhooks configured'}
                description={searchTerm ? 'Try adjusting your search terms' : 'Create your first webhook endpoint to get started'}
                action={
                  !searchTerm && (
                    <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                      Create Webhook
                    </Button>
                  )
                }
              />
            </GlassCard>
          ) : (
            filteredWebhooks.map((webhook: any) => (
              <GlassCard key={webhook.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white/90">{webhook.url}</h3>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          webhook.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        )}
                      >
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">
                      Events: {webhook.events?.join(', ') || 'None'}
                    </p>
                    {webhook.lastTriggered && (
                      <p className="text-xs text-white/50">
                        Last triggered: {format(parseISO(webhook.lastTriggered), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/webhooks/${webhook.id}/test`, {
                            method: 'POST',
                          })
                          if (!res.ok) throw new Error('Test failed')
                          toast.success('Test webhook sent successfully')
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to test webhook')
                        }
                      }}
                      tooltip="Test webhook"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleWebhook(webhook.id, webhook.isActive)}
                      isLoading={isToggling === webhook.id}
                      tooltip={webhook.isActive ? 'Deactivate' : 'Activate'}
                      className={cn(
                        webhook.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      )}
                    >
                      {webhook.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      tooltip="Delete webhook"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'incoming' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Incoming Webhooks</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white/90">Stripe Webhooks</p>
                  <p className="text-sm text-white/60">Status: Connected</p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white/90">Twilio Webhooks</p>
                  <p className="text-sm text-white/60">Status: Connected</p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'logs' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Webhook Delivery Logs</h2>
          <div className="text-center py-12 text-white/50">
            <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>View all webhook delivery attempts and responses.</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

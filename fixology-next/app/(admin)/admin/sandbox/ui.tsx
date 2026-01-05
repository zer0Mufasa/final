'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { TestTube, Plus, Trash2, Play, Code, Webhook, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSandboxClient() {
  const [activeTab, setActiveTab] = useState<'shops' | 'api' | 'webhooks'>('shops')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [preset, setPreset] = useState<'empty' | 'basic' | 'full'>('basic')
  const [apiEndpoint, setApiEndpoint] = useState('/api/admin/stats')
  const [apiMethod, setApiMethod] = useState('GET')
  const [apiBody, setApiBody] = useState('{}')
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [isTestingApi, setIsTestingApi] = useState(false)

  const { data: testShopsData, mutate } = useSWR('/api/admin/sandbox/test-shops', fetcher)
  const testShops = testShopsData?.shops || []

  const handleCreateTestShop = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/sandbox/create-test-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create test shop')
      }

      const data = await res.json()
      toast.success(`Test shop created: ${data.shop.name}`)
      setShowCreateModal(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create test shop')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTestShop = async (shopId: string) => {
    if (!confirm('Delete this test shop?')) return
    try {
      const res = await fetch(`/api/admin/sandbox/test-shops/${shopId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Test shop deleted')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete test shop')
    }
  }

  const handleTestApi = async () => {
    setIsTestingApi(true)
    setApiResponse(null)
    try {
      const options: RequestInit = {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
      }
      if (apiMethod !== 'GET' && apiBody) {
        options.body = apiBody
      }

      const res = await fetch(apiEndpoint, options)
      const data = await res.json()
      setApiResponse({ status: res.status, data })
      toast.success('API test completed')
    } catch (err: any) {
      setApiResponse({ error: err.message })
      toast.error('API test failed')
    } finally {
      setIsTestingApi(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Sandbox & Testing"
        description="Create test shops, test APIs, and send test webhooks safely."
        action={
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Test Shop
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['shops', 'api', 'webhooks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 font-medium transition-colors capitalize',
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'shops' && (
        <div className="space-y-4">
          {testShops.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon={<TestTube className="w-12 h-12 mx-auto opacity-30" />}
                title="No test shops"
                description="Create test shops with fake data for safe testing without affecting real data"
                action={
                  <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Create Test Shop
                  </Button>
                }
              />
            </GlassCard>
          ) : (
            testShops.map((shop: any) => (
              <GlassCard key={shop.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white/90">{shop.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        TEST
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">Slug: {shop.slug}</p>
                    <p className="text-xs text-white/50">
                      Created: {format(parseISO(shop.createdAt), 'MMM d, yyyy')} • Auto-delete: {shop.autoDeleteAt ? format(parseISO(shop.autoDeleteAt), 'MMM d') : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/admin/shops/${shop.id}`, '_blank')}
                      tooltip="View shop"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTestShop(shop.id)}
                      tooltip="Delete test shop"
                      className="text-rose-400 hover:text-rose-300"
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

      {activeTab === 'api' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">API Playground</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="/api/admin/stats"
                className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 font-mono text-sm"
              />
              <Button onClick={handleTestApi} isLoading={isTestingApi} leftIcon={<Play className="w-4 h-4" />}>
                Test
              </Button>
            </div>
            {apiMethod !== 'GET' && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Request Body (JSON)</label>
                <textarea
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
                />
              </div>
            )}
            {apiResponse && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Response</label>
                <pre className="p-4 rounded-lg bg-white/[0.03] border border-white/10 text-white/80 text-xs overflow-auto max-h-96">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {activeTab === 'webhooks' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Webhook Tester</h3>
          <EmptyState
            icon={<Webhook className="w-12 h-12 mx-auto opacity-30" />}
            title="Webhook tester"
            description="Send test webhooks to any URL with sample payloads"
          />
        </GlassCard>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Test Shop"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
            >
              <option value="empty">Empty - Just shop setup</option>
              <option value="basic">Basic - 10 tickets, 5 customers</option>
              <option value="full">Full - 100+ tickets, customers, inventory</option>
            </select>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <p className="text-sm text-white/60">
              {preset === 'empty' && 'Creates a shop with minimal setup'}
              {preset === 'basic' && 'Creates a shop with 10 tickets, 5 customers, and basic inventory'}
              {preset === 'full' && 'Creates a shop with 100+ tickets, 50+ customers, full inventory, and invoices'}
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateTestShop} isLoading={isCreating} className="flex-1">
              Create Test Shop
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

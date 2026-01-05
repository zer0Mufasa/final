'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Copy, Plus, History, FileText, CheckSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminCloneClient() {
  const [selectedShop, setSelectedShop] = useState<string>('')
  const [targetShopId, setTargetShopId] = useState<string>('')
  const [isCloning, setIsCloning] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('custom')
  const [cloneOptions, setCloneOptions] = useState({
    settings: true,
    branding: true,
    serviceCatalog: false,
    workflows: false,
    emailTemplates: false,
    smsTemplates: false,
    customFields: false,
    userRoles: false,
    inventoryCategories: false,
    suppliers: false,
    diagnostics: false,
    warrantyPolicies: false,
  })

  const { data: shopsData } = useSWR('/api/admin/shops?pageSize=100', fetcher)
  const { data: templatesData, mutate: mutateTemplates } = useSWR('/api/admin/clone/templates', fetcher)
  const { data: historyData, mutate: mutateHistory } = useSWR('/api/admin/clone/history?pageSize=10', fetcher)

  const shops = shopsData?.shops || []
  const templates = templatesData?.templates || []
  const history = historyData?.history || []

  const handleCloneToNew = async () => {
    if (!selectedShop) {
      toast.error('Please select a source shop')
      return
    }

    const fieldsToClone = Object.entries(cloneOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key)

    if (fieldsToClone.length === 0) {
      toast.error('Please select at least one option to clone')
      return
    }

    setIsCloning(true)
    try {
      const res = await fetch('/api/admin/clone/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceShopId: selectedShop,
          clonedFields: fieldsToClone,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to clone shop')
      }

      const data = await res.json()
      const statsMsg = data.stats && Object.keys(data.stats).length > 0
        ? ` Cloned: ${Object.entries(data.stats).map(([k, v]) => `${v} ${k}`).join(', ')}`
        : ''
      toast.success(`Shop cloned successfully!${statsMsg}`)
      mutateHistory()
      if (data.targetShopId && data.targetShopId !== 'new') {
        // Optionally navigate to the new shop
        setTimeout(() => {
          window.location.href = `/admin/shops/${data.targetShopId}`
        }, 1500)
      }
      setSelectedShop('')
      setCloneOptions({
        settings: true,
        branding: true,
        serviceCatalog: false,
        workflows: false,
        emailTemplates: false,
        smsTemplates: false,
        customFields: false,
        userRoles: false,
        inventoryCategories: false,
        suppliers: false,
        diagnostics: false,
        warrantyPolicies: false,
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to clone shop')
    } finally {
      setIsCloning(false)
    }
  }

  const handleCloneToExisting = async () => {
    if (!selectedShop || !targetShopId) {
      toast.error('Please select both source and target shops')
      return
    }

    const fieldsToClone = Object.entries(cloneOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key)

    if (fieldsToClone.length === 0) {
      toast.error('Please select at least one option to clone')
      return
    }

    setIsCloning(true)
    try {
      const res = await fetch('/api/admin/clone/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceShopId: selectedShop,
          targetShopId,
          clonedFields: fieldsToClone,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to clone shop')
      }

      toast.success('Shop cloned successfully!')
      mutateHistory()
      setSelectedShop('')
      setTargetShopId('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to clone shop')
    } finally {
      setIsCloning(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!selectedShop || !templateName) {
      toast.error('Please select a shop and enter a template name')
      return
    }

    try {
      const shop = shops.find((s: any) => s.id === selectedShop)
      if (!shop) {
        toast.error('Shop not found')
        return
      }

      // Create template config from shop
      const config = {
        name: shop.name,
        plan: shop.plan,
        features: shop.features,
        // Add more fields as needed
      }

      const res = await fetch('/api/admin/clone/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          category: templateCategory,
          config,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create template')
      }

      toast.success('Template created successfully!')
      mutateTemplates()
      setShowTemplateModal(false)
      setTemplateName('')
      setTemplateCategory('custom')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create template')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Clone Center"
        description="Clone shops, save templates, and bulk apply configurations."
        action={
          <button
            onClick={() => setShowTemplateModal(true)}
            disabled={!selectedShop}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white/90 mb-4">Clone Shop</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Source Shop</label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              >
                <option value="">Select a shop...</option>
                {shops.map((shop: any) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.plan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Target Shop (for existing)</label>
              <select
                value={targetShopId}
                onChange={(e) => setTargetShopId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              >
                <option value="">Select target shop (leave empty for new shop)...</option>
                {shops.map((shop: any) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} ({shop.plan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">What to Clone</label>
              <div className="space-y-2">
                {Object.entries(cloneOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setCloneOptions({ ...cloneOptions, [key]: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500/20"
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCloneToNew}
                disabled={isCloning || !selectedShop}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCloning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Clone to New Shop
                  </>
                )}
              </button>
              <button
                onClick={handleCloneToExisting}
                disabled={isCloning || !selectedShop || !targetShopId}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clone to Existing Shop
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/[0.05] text-white/70 hover:text-white/90 transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Template Library
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/[0.05] text-white/70 hover:text-white/90 transition-colors flex items-center gap-2">
              <History className="w-4 h-4" />
              Clone History
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/[0.05] text-white/70 hover:text-white/90 transition-colors flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Bulk Apply
            </button>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Template Library</h2>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No templates yet. Create your first template from a shop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <div
                key={template.id}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
              >
                <h3 className="font-semibold text-white/90 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-white/60 mb-2">{template.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    {template.category || 'custom'}
                  </span>
                  <span className="text-xs text-white/50">
                    {format(parseISO(template.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {history.length > 0 && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Recent Clone History</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white/90">
                    Cloned {item.sourceType === 'shop' ? 'shop' : 'template'} to{' '}
                    {item.targetShopId === 'new' ? 'new shop' : 'existing shop'}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {item.clonedFields.length} fields • {format(parseISO(item.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <span className="text-xs text-white/50">{item.admin.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Create Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Starter Kit, Pro Setup"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                >
                  <option value="starter">Starter Kit</option>
                  <option value="pro">Pro Setup</option>
                  <option value="enterprise">Enterprise Config</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateTemplate} className="btn-primary flex-1">
                  Create Template
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    setTemplateName('')
                    setTemplateCategory('custom')
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

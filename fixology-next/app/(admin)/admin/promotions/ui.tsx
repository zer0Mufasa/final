'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Gift, Plus, Percent, DollarSign, Users, TrendingUp, Copy, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { Modal } from '@/components/admin/ui/modal'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { SearchInput } from '@/components/admin/ui/search-input'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminPromotionsClient() {
  const [activeTab, setActiveTab] = useState<'codes' | 'referrals' | 'partners'>('codes')
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    amount: 10,
    maxUses: '',
    expiresAt: '',
    validPlans: [] as string[],
  })

  const { data: codesData, mutate, error } = useSWR('/api/admin/promotions/codes', fetcher)
  const codes = codesData?.codes || []

  const filteredCodes = codes.filter((code: any) =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateCode = async () => {
    if (!newCode.code || !newCode.amount) {
      toast.error('Code and amount are required')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/promotions/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCode,
          maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : null,
          expiresAt: newCode.expiresAt || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create discount code')
      }

      toast.success('Discount code created successfully')
      setShowCodeModal(false)
      setNewCode({ code: '', type: 'percentage', amount: 10, maxUses: '', expiresAt: '', validPlans: [] })
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create discount code')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Promotions"
        description="Manage discount codes, referrals, and partner deals."
        action={
          <Button onClick={() => setShowCodeModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Discount Code
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['codes', 'referrals', 'partners'] as const).map((tab) => (
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

      {activeTab === 'codes' && (
        <>
          <GlassCard>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search discount codes..."
            />
          </GlassCard>
          <div className="space-y-4">
            {error ? (
              <GlassCard>
                <EmptyState
                  icon={<Gift className="w-12 h-12 mx-auto opacity-30" />}
                  title="Failed to load codes"
                  description="There was an error loading discount codes. Please try again."
                  action={<Button onClick={() => mutate()} variant="secondary">Retry</Button>}
                />
              </GlassCard>
            ) : filteredCodes.length === 0 ? (
              <GlassCard>
                <EmptyState
                  icon={<Gift className="w-12 h-12 mx-auto opacity-30" />}
                  title={searchTerm ? 'No codes found' : 'No discount codes created'}
                  description={searchTerm ? 'Try adjusting your search terms' : 'Create your first discount code to start offering promotions'}
                  action={
                    !searchTerm && (
                      <Button onClick={() => setShowCodeModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Create Discount Code
                      </Button>
                    )
                  }
                />
              </GlassCard>
            ) : (
              filteredCodes.map((code: any) => (
                <GlassCard key={code.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-mono font-semibold text-white/90 text-lg">{code.code}</h3>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            code.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          )}
                        >
                          {code.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          {code.type === 'PERCENTAGE' ? (
                            <Percent className="w-4 h-4" />
                          ) : (
                            <DollarSign className="w-4 h-4" />
                          )}
                          {code.type === 'PERCENTAGE' ? `${code.amount}%` : `$${code.amount / 100}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {code.usedCount} / {code.maxUses || '∞'} uses
                        </span>
                        {code.expiresAt && (
                          <span>
                            Expires: {format(parseISO(code.expiresAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(code.code)}
                        tooltip="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Delete this discount code?')) return
                          try {
                            const res = await fetch(`/api/admin/promotions/codes/${code.id}`, { method: 'DELETE' })
                            if (!res.ok) throw new Error('Failed to delete')
                            toast.success('Code deleted')
                            mutate()
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to delete code')
                          }
                        }}
                        tooltip="Delete code"
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
        </>
      )}

      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title="Create Discount Code"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Code</label>
            <input
              type="text"
              value={newCode.code}
              onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER2024"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Type</label>
              <select
                value={newCode.type}
                onChange={(e) => setNewCode({ ...newCode, type: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {newCode.type === 'percentage' ? 'Discount %' : 'Amount ($)'}
              </label>
              <input
                type="number"
                value={newCode.amount}
                onChange={(e) => setNewCode({ ...newCode, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Max Uses (optional)</label>
            <input
              type="number"
              value={newCode.maxUses}
              onChange={(e) => setNewCode({ ...newCode, maxUses: e.target.value })}
              placeholder="Unlimited"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={newCode.expiresAt}
              onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateCode} isLoading={isCreating} className="flex-1">
              Create Code
            </Button>
            <Button variant="secondary" onClick={() => setShowCodeModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {activeTab === 'referrals' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Referral Program</h2>
          <div className="text-center py-12 text-white/50">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Referral program configuration and statistics.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'partners' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Partner Deals</h2>
          <div className="text-center py-12 text-white/50">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Manage partner-specific pricing and deals.</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

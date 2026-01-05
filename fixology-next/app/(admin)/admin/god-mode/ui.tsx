'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Zap, AlertTriangle, Lock, Edit, DollarSign, User, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

export function AdminGodModeClient() {
  const [activeTab, setActiveTab] = useState<'data' | 'financial' | 'subscription' | 'account' | 'time' | 'emergency'>('data')
  const [confirmText, setConfirmText] = useState('')

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="God Mode"
        description="Super admin controls - use with extreme caution. All actions are logged."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold text-rose-300">CEO ONLY</span>
          </div>
        }
      />

      <GlassCard className="border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white/90 mb-1">Warning: God Mode</h3>
            <p className="text-sm text-white/70">
              These actions bypass all validation and can cause irreversible damage. Every action is logged and requires confirmation.
              Only use when absolutely necessary.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-2 border-b border-white/[0.06] overflow-x-auto">
        {(['data', 'financial', 'subscription', 'account', 'time', 'emergency'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab === 'data' && 'Data Manipulation'}
            {tab === 'financial' && 'Financial Overrides'}
            {tab === 'subscription' && 'Subscription'}
            {tab === 'account' && 'Account Takeover'}
            {tab === 'time' && 'Time Travel'}
            {tab === 'emergency' && 'Emergency Controls'}
          </button>
        ))}
      </div>

      {activeTab === 'data' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Data Manipulation
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Edit ANY field on ANY shop directly</p>
              <button className="btn-secondary">Open Raw Editor</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Bypass all validation rules</p>
              <button className="btn-secondary">Enable Bypass Mode</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Restore soft-deleted records</p>
              <button className="btn-secondary">View Deleted Records</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'financial' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Financial Overrides
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Set custom MRR for any shop (override Stripe)</p>
              <button className="btn-secondary">Override MRR</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Grant unlimited free credits</p>
              <button className="btn-secondary">Grant Credits</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Mark invoices as paid without payment</p>
              <button className="btn-secondary">Mark Invoice Paid</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'subscription' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Subscription Manipulation
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Force upgrade without payment</p>
              <button className="btn-secondary">Force Upgrade</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Pause subscription indefinitely</p>
              <button className="btn-secondary">Pause Subscription</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Override plan limits</p>
              <button className="btn-secondary">Override Limits</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'account' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Takeover
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Login as ANY user instantly (no password)</p>
              <button className="btn-secondary">Login as User</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Reset ANY password to known value</p>
              <button className="btn-secondary">Reset Password</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Merge two user accounts</p>
              <button className="btn-secondary">Merge Accounts</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'time' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time Travel (Dangerous)
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">View shop as it was on specific date</p>
              <button className="btn-secondary">View Historical State</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Rollback shop to previous state</p>
              <button className="btn-secondary">Rollback Shop</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Replay events from audit log</p>
              <button className="btn-secondary">Replay Events</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'emergency' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Controls
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <p className="text-sm text-white/90 mb-3 font-semibold">Freeze ALL shops (platform maintenance)</p>
              <input
                type="text"
                placeholder="Type 'FREEZE ALL' to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 mb-2"
              />
              <button
                disabled={confirmText !== 'FREEZE ALL'}
                className="btn-secondary bg-rose-500/20 border-rose-500/30 text-rose-300 disabled:opacity-50"
              >
                Freeze All Shops
              </button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Force logout all users platform-wide</p>
              <button className="btn-secondary">Force Logout All</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 mb-3">Enable read-only mode</p>
              <button className="btn-secondary">Enable Read-Only</button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

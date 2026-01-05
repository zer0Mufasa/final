'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { AlertTriangle, Plus, Bell, CheckCircle, Clock, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminAlertsClient() {
  const [activeTab, setActiveTab] = useState<'rules' | 'active' | 'history'>('rules')
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    name: '',
    condition: { type: 'mrr_drop', threshold: 10 },
    channels: ['email'],
    recipients: [],
  })

  const { data: rulesData, mutate: mutateRules } = useSWR('/api/admin/alerts/rules', fetcher)
  const rules = rulesData?.rules || []

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Alerts & Monitoring"
        description="Create alert rules and monitor platform health."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">0</p>
              <p className="text-sm text-white/60">Active Alerts</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">0</p>
              <p className="text-sm text-white/60">Alert Rules</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">—</p>
              <p className="text-sm text-white/60">Resolved Today</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['rules', 'active', 'history'] as const).map((tab) => (
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

      {activeTab === 'rules' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Alert Rules</h2>
            <button
              onClick={() => setShowRuleModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No alert rules configured. Create rules to monitor platform health.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white/90">{rule.name}</h3>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            rule.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          )}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-white/60">
                        Channels: {rule.channels.join(', ')} • {rule._count?.alerts || 0} alerts triggered
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/admin/alerts/rules/${rule.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isActive: !rule.isActive }),
                          })
                          if (!res.ok) throw new Error('Failed to toggle rule')
                          toast.success(`Rule ${!rule.isActive ? 'activated' : 'deactivated'}`)
                          mutateRules()
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to toggle rule')
                        }
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        rule.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      )}
                    >
                      {rule.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'active' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Active Alerts</h2>
          <div className="text-center py-12 text-white/50">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No active alerts. All systems operational.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'history' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Alert History</h2>
          <div className="text-center py-12 text-white/50">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>View past alerts and their resolution history.</p>
          </div>
        </GlassCard>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Create Alert Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g., MRR Drop Alert"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Condition Type</label>
                <select
                  value={ruleForm.condition.type}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      condition: { ...ruleForm.condition, type: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                >
                  <option value="mrr_drop">MRR Drops by X%</option>
                  <option value="churn_rate">Churn Rate Exceeds X%</option>
                  <option value="error_rate">Error Rate Exceeds X%</option>
                  <option value="failed_payments">Failed Payments Exceed X</option>
                  <option value="no_signups">No Signups in X Hours</option>
                </select>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                <p className="text-sm text-white/60">
                  Advanced condition builder coming soon. For now, basic rules are created with default thresholds.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/alerts/rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...ruleForm,
                          recipients: ['admin@fixology.com'], // Default for now
                        }),
                      })
                      if (!res.ok) throw new Error('Failed to create rule')
                      toast.success('Alert rule created successfully!')
                      mutateRules()
                      setShowRuleModal(false)
                      setRuleForm({
                        name: '',
                        condition: { type: 'mrr_drop', threshold: 10 },
                        channels: ['email'],
                        recipients: [],
                      })
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to create rule')
                    }
                  }}
                  className="btn-primary flex-1"
                >
                  Create Rule
                </button>
                <button
                  onClick={() => {
                    setShowRuleModal(false)
                    setRuleForm({
                      name: '',
                      condition: { type: 'mrr_drop', threshold: 10 },
                      channels: ['email'],
                      recipients: [],
                    })
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

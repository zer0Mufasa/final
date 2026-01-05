'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Mail, Plus, Send, FileText, BarChart3, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminEmailsClient() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'templates' | 'logs'>('broadcast')
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    subject: '',
    content: '',
    recipientType: 'all',
    scheduledAt: '',
  })

  const { data: broadcastsData } = useSWR('/api/admin/emails/broadcasts', fetcher)
  const broadcasts = broadcastsData?.broadcasts || []

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Email Center"
        description="Send broadcasts, manage templates, and track email performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">0</p>
              <p className="text-sm text-white/60">Sent Today</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">—</p>
              <p className="text-sm text-white/60">Open Rate</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">—</p>
              <p className="text-sm text-white/60">Click Rate</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">0</p>
              <p className="text-sm text-white/60">Bounces</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['broadcast', 'templates', 'logs'] as const).map((tab) => (
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

      {activeTab === 'broadcast' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Send Broadcast</h2>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Broadcast
            </button>
          </div>
          {broadcasts.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Create a new email broadcast to send to shops or users.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast: any) => (
                <div
                  key={broadcast.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white/90">{broadcast.subject}</p>
                      <p className="text-xs text-white/50 mt-1">
                        {broadcast.recipientType} • {broadcast.status} •{' '}
                        {broadcast.scheduledAt
                          ? format(parseISO(broadcast.scheduledAt), 'MMM d, yyyy h:mm a')
                          : format(parseISO(broadcast.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      {broadcast.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'templates' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Email Templates</h2>
          </div>
          <div className="text-center py-12 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Manage system email templates here.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'logs' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Email Logs</h2>
          <div className="text-center py-12 text-white/50">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>View all sent emails and their delivery status.</p>
          </div>
        </GlassCard>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Create Email Broadcast</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Subject</label>
                <input
                  type="text"
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                  placeholder="Email subject line"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Content</label>
                <textarea
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  placeholder="Email content (supports HTML)"
                  rows={8}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Recipients</label>
                  <select
                    value={broadcastForm.recipientType}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, recipientType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                  >
                    <option value="all">All Shops</option>
                    <option value="plans">Specific Plans</option>
                    <option value="shops">Specific Shops</option>
                    <option value="segment">Segment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={broadcastForm.scheduledAt}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduledAt: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/emails/broadcast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...broadcastForm,
                          scheduledAt: broadcastForm.scheduledAt || null,
                        }),
                      })
                      if (!res.ok) throw new Error('Failed to create broadcast')
                      toast.success('Broadcast created successfully!')
                      setShowBroadcastModal(false)
                      setBroadcastForm({ subject: '', content: '', recipientType: 'all', scheduledAt: '' })
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to create broadcast')
                    }
                  }}
                  className="btn-primary flex-1"
                >
                  Create Broadcast
                </button>
                <button
                  onClick={() => {
                    setShowBroadcastModal(false)
                    setBroadcastForm({ subject: '', content: '', recipientType: 'all', scheduledAt: '' })
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

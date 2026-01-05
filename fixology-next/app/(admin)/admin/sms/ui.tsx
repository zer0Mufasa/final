'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { MessageSquare, Plus, Send, DollarSign, BarChart3 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSMSClient() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'templates' | 'logs'>('broadcast')

  const { data: statsData } = useSWR('/api/admin/sms/stats', fetcher)
  const stats = statsData || { sentToday: 0, successRate: 0, costToday: 0, failed: 0 }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="SMS Center"
        description="Send SMS broadcasts, manage templates, and track costs."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.sentToday || 0}</p>
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
              <p className="text-2xl font-bold text-white/95">{stats.successRate?.toFixed(1) || '0'}%</p>
              <p className="text-sm text-white/60">Success Rate</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">${(stats.costToday || 0).toFixed(2)}</p>
              <p className="text-sm text-white/60">Cost Today</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.failed || 0}</p>
              <p className="text-sm text-white/60">Failed</p>
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
            <h2 className="text-xl font-semibold text-white/90">Send Broadcast SMS</h2>
            <button className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Broadcast
            </button>
          </div>
          <div className="text-center py-12 text-white/50">
            <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Create a new SMS broadcast to send to shops or users.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'templates' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">SMS Templates</h2>
          <div className="text-center py-12 text-white/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Manage SMS templates with character count and segment indicators.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'logs' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">SMS Logs</h2>
          <div className="text-center py-12 text-white/50">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>View all sent SMS messages and delivery status.</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

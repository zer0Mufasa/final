'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Settings, Globe, Mail, Shield, CreditCard, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSettingsClient() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'billing'>('general')
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    platformName: 'Fixology',
    supportEmail: 'support@fixology.ai',
    enableMaintenance: false,
    require2FA: false,
    sessionTimeout: 24,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Settings saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Platform Settings"
        description="Global platform configuration"
        action={
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['general', 'email', 'security', 'billing'] as const).map((tab) => (
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

      {activeTab === 'general' && (
        <GlassCard>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={settings.enableMaintenance}
                  onChange={(e) => setSettings({ ...settings, enableMaintenance: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500/20"
                />
                Enable maintenance mode
              </label>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'email' && (
        <GlassCard>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.sendgrid.net"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">SMTP Port</label>
              <input
                type="number"
                placeholder="587"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">From Email</label>
              <input
                type="email"
                placeholder="noreply@fixology.ai"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'security' && (
        <GlassCard>
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={settings.require2FA}
                  onChange={(e) => setSettings({ ...settings, require2FA: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-purple-500 focus:ring-purple-500/20"
                />
                Require 2FA for admin accounts
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Session Timeout (hours)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 24 })}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Rate Limit (requests/min)</label>
              <input
                type="number"
                placeholder="100"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'billing' && (
        <GlassCard>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Stripe API Key</label>
              <input
                type="password"
                placeholder="sk_live_..."
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Default Currency</label>
              <select className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

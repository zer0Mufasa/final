'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Palette, Upload, Eye, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/admin/ui/button'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminBrandingClient() {
  const [activeTab, setActiveTab] = useState<'platform' | 'email'>('platform')
  const [isSaving, setIsSaving] = useState(false)
  const [branding, setBranding] = useState({
    platformName: 'Fixology',
    primaryColor: '#8b5cf6',
    secondaryColor: '#c026d3',
    logoLight: '',
    logoDark: '',
    favicon: '',
    customCSS: '',
    emailHeader: '',
    emailFooter: '',
  })

  const { data, mutate } = useSWR('/api/admin/branding', fetcher)

  useEffect(() => {
    if (data) {
      setBranding((prev) => ({ ...prev, ...data }))
    }
  }, [data])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      })

      if (!res.ok) throw new Error('Failed to save branding')
      toast.success('Branding saved successfully')
      mutate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save branding')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Branding & White-Label"
        description="Customize platform branding, logos, and colors."
        action={
          <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['platform', 'email'] as const).map((tab) => (
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

      {activeTab === 'platform' && (
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-white/90 mb-4">Platform Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Platform Name</label>
                <input
                  type="text"
                  value={branding.platformName}
                  onChange={(e) => setBranding({ ...branding, platformName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-16 h-10 rounded-lg border border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-16 h-10 rounded-lg border border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Logo (Light)</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-light"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // TODO: Upload to storage and get URL
                          toast.info('Logo upload coming soon')
                        }
                      }}
                    />
                    <label
                      htmlFor="logo-light"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm cursor-pointer hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Logo (Dark)</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-dark"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          toast.info('Logo upload coming soon')
                        }
                      }}
                    />
                    <label
                      htmlFor="logo-dark"
                      className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm cursor-pointer hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Favicon</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="favicon"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      toast.info('Favicon upload coming soon')
                    }
                  }}
                />
                <label
                  htmlFor="favicon"
                  className="inline-block px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm cursor-pointer hover:bg-white/[0.08] transition-colors"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload Favicon
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Custom CSS</label>
                <textarea
                  value={branding.customCSS}
                  onChange={(e) => setBranding({ ...branding, customCSS: e.target.value })}
                  rows={8}
                  placeholder="/* Add custom CSS here */"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'email' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Email Branding</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email Header (HTML)</label>
              <textarea
                value={branding.emailHeader}
                onChange={(e) => setBranding({ ...branding, emailHeader: e.target.value })}
                rows={6}
                placeholder="<div>Email header HTML</div>"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email Footer (HTML)</label>
              <textarea
                value={branding.emailFooter}
                onChange={(e) => setBranding({ ...branding, emailFooter: e.target.value })}
                rows={6}
                placeholder="<div>Email footer HTML</div>"
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

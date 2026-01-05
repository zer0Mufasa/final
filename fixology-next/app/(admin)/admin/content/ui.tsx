'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { FileText, Plus, BookOpen, ScrollText, Scale, Shield } from 'lucide-react'

export function AdminContentClient() {
  const [activeTab, setActiveTab] = useState<'help' | 'changelog' | 'legal'>('help')

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Content Manager"
        description="Manage help articles, changelog, legal pages, and marketing content."
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['help', 'changelog', 'legal'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab === 'help' && 'Help Center'}
            {tab === 'changelog' && 'Changelog'}
            {tab === 'legal' && 'Legal Pages'}
          </button>
        ))}
      </div>

      {activeTab === 'help' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Help Center Articles</h2>
            <button className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Article
            </button>
          </div>
          <div className="text-center py-12 text-white/50">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Manage knowledge base articles with categories and tags.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'changelog' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Release Notes / Changelog</h2>
            <button className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Release
            </button>
          </div>
          <div className="text-center py-12 text-white/50">
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Create release notes with version numbers and feature announcements.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'legal' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Legal Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer">
              <Scale className="w-8 h-8 text-purple-400 mb-2" />
              <p className="font-semibold text-white/90 mb-1">Terms of Service</p>
              <p className="text-xs text-white/60">Edit terms and version history</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-blue-400 mb-2" />
              <p className="font-semibold text-white/90 mb-1">Privacy Policy</p>
              <p className="text-xs text-white/60">Edit privacy policy</p>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors cursor-pointer">
              <Shield className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="font-semibold text-white/90 mb-1">Acceptable Use</p>
              <p className="text-xs text-white/60">Edit acceptable use policy</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Globe, Plus, Download, Upload, CheckCircle, XCircle, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { SearchInput } from '@/components/admin/ui/search-input'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
]

export function AdminLocalizationClient() {
  const [activeTab, setActiveTab] = useState<'languages' | 'translations'>('languages')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const [editingKey, setEditingKey] = useState<{ key: string; value: string } | null>(null)

  const { data: languagesData, mutate: mutateLanguages } = useSWR('/api/admin/localization/languages', fetcher)
  const { data: translationsData, mutate: mutateTranslations } = useSWR(
    activeTab === 'translations' ? `/api/admin/localization/translations?language=${selectedLanguage}` : null,
    fetcher
  )

  const enabledLanguages = languagesData?.languages || ['en']
  const translations = translationsData?.translations || []

  const filteredTranslations = translations.filter((t: any) =>
    t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleLanguage = async (code: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/localization/languages/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (!res.ok) throw new Error('Failed to toggle language')
      toast.success(`Language ${!enabled ? 'enabled' : 'disabled'}`)
      mutateLanguages()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update language')
    }
  }

  const handleSaveTranslation = async () => {
    if (!editingKey) return

    try {
      const res = await fetch('/api/admin/localization/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingKey.key,
          language: selectedLanguage,
          value: editingKey.value,
        }),
      })

      if (!res.ok) throw new Error('Failed to save translation')
      toast.success('Translation saved')
      setShowTranslationModal(false)
      setEditingKey(null)
      mutateTranslations()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save translation')
    }
  }

  const getCompletionPercent = (lang: string) => {
    const total = translations.length
    const complete = translations.filter((t: any) => t.language === lang && t.isComplete).length
    return total > 0 ? Math.round((complete / total) * 100) : 0
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Localization"
        description="Manage multi-language support and translations."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>
              Import
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['languages', 'translations'] as const).map((tab) => (
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

      {activeTab === 'languages' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isEnabled = enabledLanguages.includes(lang.code)
            const completion = getCompletionPercent(lang.code)
            return (
              <GlassCard key={lang.code}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white/90 mb-1">{lang.name}</h3>
                    <p className="text-sm text-white/60">{lang.nativeName}</p>
                  </div>
                  {isEnabled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {isEnabled && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                      <span>Translation</span>
                      <span>{completion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleToggleLanguage(lang.code, isEnabled)}
                  className="w-full"
                >
                  {isEnabled ? 'Disable' : 'Enable'}
                </Button>
              </GlassCard>
            )
          })}
        </div>
      )}

      {activeTab === 'translations' && (
        <>
          <div className="flex gap-4">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
            >
              {SUPPORTED_LANGUAGES.filter((lang) => enabledLanguages.includes(lang.code)).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <GlassCard className="flex-1 p-0">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search translation keys..."
              />
            </GlassCard>
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {filteredTranslations.length === 0 ? (
                <div className="p-12 text-center text-white/50">
                  <Languages className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No translations found</p>
                </div>
              ) : (
                filteredTranslations.map((translation: any) => (
                  <div
                    key={translation.key}
                    className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingKey({ key: translation.key, value: translation.value })
                      setShowTranslationModal(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm text-purple-300 font-mono">{translation.key}</code>
                          {!translation.isComplete && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70">{translation.value || <span className="text-white/40 italic">No translation</span>}</p>
                        {translation.context && (
                          <p className="text-xs text-white/50 mt-1">Context: {translation.context}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      )}

      <Modal
        isOpen={showTranslationModal}
        onClose={() => {
          setShowTranslationModal(false)
          setEditingKey(null)
        }}
        title="Edit Translation"
        size="lg"
      >
        {editingKey && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Key</label>
              <code className="block px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm">
                {editingKey.key}
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Translation ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name})</label>
              <textarea
                value={editingKey.value}
                onChange={(e) => setEditingKey({ ...editingKey, value: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveTranslation} className="flex-1">
                Save Translation
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTranslationModal(false)
                  setEditingKey(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

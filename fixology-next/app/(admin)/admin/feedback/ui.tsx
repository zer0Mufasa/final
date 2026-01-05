'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { MessageCircle, TrendingUp, Filter, Star, MessageSquare, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { StatCard } from '@/components/admin/ui/stat-card'
import { SearchInput } from '@/components/admin/ui/search-input'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminFeedbackClient() {
  const [activeTab, setActiveTab] = useState<'nps' | 'surveys' | 'inbox'>('nps')
  const [searchTerm, setSearchTerm] = useState('')
  const [npsFilter, setNpsFilter] = useState<'all' | 'promoters' | 'passives' | 'detractors'>('all')

  const { data: npsData } = useSWR('/api/admin/feedback/nps', fetcher)
  const { data: surveysData } = useSWR('/api/admin/feedback/surveys', fetcher)
  const { data: inboxData } = useSWR('/api/admin/feedback/inbox', fetcher)

  const nps = npsData?.surveys || []
  const surveys = surveysData?.surveys || []
  const inbox = inboxData?.feedback || []

  const npsScore = nps.length > 0
    ? Math.round(nps.reduce((sum: number, s: any) => sum + s.score, 0) / nps.length)
    : 0

  const promoters = nps.filter((s: any) => s.score >= 9).length
  const passives = nps.filter((s: any) => s.score >= 7 && s.score <= 8).length
  const detractors = nps.filter((s: any) => s.score <= 6).length

  const filteredNPS = nps.filter((s: any) => {
    if (npsFilter === 'promoters') return s.score >= 9
    if (npsFilter === 'passives') return s.score >= 7 && s.score <= 8
    if (npsFilter === 'detractors') return s.score <= 6
    return true
  })

  const filteredInbox = inbox.filter((f: any) =>
    f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Feedback & NPS"
        description="Track customer satisfaction, NPS scores, and feedback."
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['nps', 'surveys', 'inbox'] as const).map((tab) => (
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

      {activeTab === 'nps' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              tone="violet"
              label="NPS Score"
              value={npsScore}
              subValue={`${promoters} promoters, ${detractors} detractors`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              tone="emerald"
              label="Promoters"
              value={promoters}
              subValue={`${nps.length > 0 ? Math.round((promoters / nps.length) * 100) : 0}%`}
              icon={<Star className="w-5 h-5" />}
            />
            <StatCard
              tone="amber"
              label="Passives"
              value={passives}
              subValue={`${nps.length > 0 ? Math.round((passives / nps.length) * 100) : 0}%`}
              icon={<MessageSquare className="w-5 h-5" />}
            />
            <StatCard
              tone="rose"
              label="Detractors"
              value={detractors}
              subValue={`${nps.length > 0 ? Math.round((detractors / nps.length) * 100) : 0}%`}
              icon={<Filter className="w-5 h-5" />}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'promoters', 'passives', 'detractors'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setNpsFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  npsFilter === filter
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/[0.05] border border-white/10 text-white/60 hover:text-white/80'
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <GlassCard className="p-0 overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {filteredNPS.length === 0 ? (
                <EmptyState
                  icon={<Star className="w-12 h-12 mx-auto opacity-30" />}
                  title="No NPS responses"
                  description="NPS survey responses will appear here"
                />
              ) : (
                filteredNPS.map((response: any) => (
                  <div key={response.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-white/90">{response.score}</span>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            response.score >= 9 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            response.score >= 7 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          )}>
                            {response.category || (response.score >= 9 ? 'Promoter' : response.score >= 7 ? 'Passive' : 'Detractor')}
                          </span>
                        </div>
                        {response.comment && (
                          <p className="text-sm text-white/70 mb-2">{response.comment}</p>
                        )}
                        <p className="text-xs text-white/50">
                          {format(parseISO(response.createdAt), 'MMM d, yyyy h:mm a')}
                          {response.shopId && ` • Shop ID: ${response.shopId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'surveys' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/90">Custom Surveys</h3>
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Survey</Button>
          </div>
          <EmptyState
            icon={<MessageSquare className="w-12 h-12 mx-auto opacity-30" />}
            title="No custom surveys"
            description="Create custom surveys to gather specific feedback from shops"
          />
        </GlassCard>
      )}

      {activeTab === 'inbox' && (
        <>
          <GlassCard>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search feedback..."
            />
          </GlassCard>
          <GlassCard className="p-0 overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {filteredInbox.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle className="w-12 h-12 mx-auto opacity-30" />}
                  title="No feedback"
                  description="Customer feedback submissions will appear here"
                />
              ) : (
                filteredInbox.map((item: any) => (
                  <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white/90">{item.subject}</h3>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            item.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            item.status === 'reviewed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          )}>
                            {item.status}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{item.content}</p>
                        <p className="text-xs text-white/50">
                          {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                          {item.shopId && ` • Shop ID: ${item.shopId}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}

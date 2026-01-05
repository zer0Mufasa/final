'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Tags, Plus, Filter, Users, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function SegmentRulesPreview({ rules }: { rules: any }) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return <p className="text-xs text-white/40 mt-1">No rules defined</p>
  }

  return (
    <div className="mt-2 space-y-1">
      {rules.slice(0, 2).map((rule: any, idx: number) => (
        <p key={idx} className="text-xs text-white/50">
          {rule.field} {rule.operator} {rule.value}
        </p>
      ))}
      {rules.length > 2 && (
        <p className="text-xs text-white/40">+{rules.length - 2} more rules</p>
      )}
    </div>
  )
}

export function AdminSegmentsClient() {
  const [activeTab, setActiveTab] = useState<'tags' | 'segments'>('tags')
  const [showTagModal, setShowTagModal] = useState(false)
  const [showSegmentModal, setShowSegmentModal] = useState(false)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#8884d8')
  const [segmentName, setSegmentName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [isCreatingSegment, setIsCreatingSegment] = useState(false)

  const { data: tagsData, mutate: mutateTags, error: tagsError } = useSWR('/api/admin/tags', fetcher)
  const { data: segmentsData, mutate: mutateSegments, error: segmentsError } = useSWR('/api/admin/segments', fetcher)

  const tags = tagsData?.tags || []
  const segments = segmentsData?.segments || []

  const filteredTags = tags.filter((tag: any) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredSegments = segments.filter((segment: any) =>
    segment.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateTag = async () => {
    if (!tagName) {
      toast.error('Tag name is required')
      return
    }

    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName, color: tagColor }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create tag')
      }

      toast.success('Tag created successfully!')
      mutateTags()
      setShowTagModal(false)
      setTagName('')
      setTagColor('#8884d8')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tag')
    }
  }

  const handleCreateSegment = async () => {
    if (!segmentName) {
      toast.error('Segment name is required')
      return
    }

    // Basic rule structure - can be expanded
    const rules = [
      { field: 'plan', operator: 'equals', value: 'PRO' },
    ]

    try {
      const res = await fetch('/api/admin/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: segmentName, rules }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create segment')
      }

      toast.success('Segment created successfully!')
      mutateSegments()
      setShowSegmentModal(false)
      setSegmentName('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create segment')
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Tags & Segments"
        description="Tag shops and create dynamic segments for targeting."
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'tags'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Tags
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'segments'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Segments
        </button>
      </div>

      {activeTab === 'tags' && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white/90">Shop Tags</h2>
              <button
                onClick={() => setShowTagModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Tag
              </button>
            </div>
            {tags.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Tags className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No tags created yet. Create tags to organize shops.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag: any) => (
                  <div
                    key={tag.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <p className="font-semibold text-white/90">{tag.name}</p>
                        <p className="text-xs text-white/50">{tag._count?.shops || 0} shops</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white/90">Dynamic Segments</h2>
              <button
                onClick={() => setShowSegmentModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Segment
              </button>
            </div>
            {segments.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No segments created yet. Create segments to target shops dynamically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {segments.map((segment: any) => (
                  <div
                    key={segment.id}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white/90">{segment.name}</p>
                        <p className="text-xs text-white/50 mt-1">
                          {Array.isArray(segment.rules) ? segment.rules.length : 0} rules
                        </p>
                        <SegmentRulesPreview rules={segment.rules} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/segments/${segment.id}/shops`)
                              const data = await res.json()
                              toast.success(`Segment matches ${data.count} shops`)
                            } catch (err: any) {
                              toast.error('Failed to evaluate segment')
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="View matching shops"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Create Tag</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g., VIP, Beta Tester, High Risk"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Color</label>
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-full h-10 rounded-lg bg-white/[0.05] border border-white/10"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateTag} className="btn-primary flex-1">
                  Create Tag
                </button>
                <button
                  onClick={() => {
                    setShowTagModal(false)
                    setTagName('')
                    setTagColor('#8884d8')
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

      {/* Segment Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold text-white/90 mb-4">Create Segment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Segment Name</label>
                <input
                  type="text"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g., High MRR Shops, Trial Ending Soon"
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                />
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                <p className="text-sm text-white/60">
                  Segment rules builder coming soon. For now, segments are created with default rules.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateSegment} className="btn-primary flex-1">
                  Create Segment
                </button>
                <button
                  onClick={() => {
                    setShowSegmentModal(false)
                    setSegmentName('')
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

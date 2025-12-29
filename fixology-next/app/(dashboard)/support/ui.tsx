'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight, LifeBuoy, MessageSquare, BookOpen, Ticket, Send } from 'lucide-react'

export function SupportClient() {
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Bug')
  const [details, setDetails] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <PageHeader
        title="Support"
        description="Get help fast: chat placeholder, support center, or file a ticket with the right details."
        action={
          <Button rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />} variant="secondary">
            View status (UI)
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[180px] rounded-3xl" />
          <Skeleton className="h-[180px] rounded-3xl" />
          <Skeleton className="h-[180px] rounded-3xl" />
          <Skeleton className="h-[360px] rounded-3xl lg:col-span-3" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">Chat with Fixo</div>
                  <div className="text-xs text-white/50 mt-0.5">Placeholder chat experience</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/55 leading-relaxed">
                Ask a question, paste an error, or describe the workflow you want. We’ll wire the assistant later.
              </div>
              <button className="btn-primary px-4 py-3 rounded-xl w-full mt-4">Open chat (UI)</button>
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">Support Center</div>
                  <div className="text-xs text-white/50 mt-0.5">Guides + best practices (UI)</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/55 leading-relaxed">
                Fast articles for intake, common repairs, messaging, and inventory habits.
              </div>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-4">Browse articles (UI)</button>
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">File a Ticket</div>
                  <div className="text-xs text-white/50 mt-0.5">Best for bugs & billing</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/55 leading-relaxed">
                Share steps to reproduce, what you expected, and what happened instead.
              </div>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-4">Start below</button>
            </GlassCard>
          </div>

          <div className="mt-4">
            <GlassCard className="rounded-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Ticket className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Support ticket form (UI)
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 grid gap-4">
                  <div>
                    <label className="label">Subject</label>
                    <input className="input bg-white/[0.04] border-white/10" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Ticket board drag/drop feels sticky" />
                  </div>
                  <div>
                    <label className="label">Details</label>
                    <textarea className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[180px]" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Steps to reproduce, what you expected, what happened, and any screenshots (UI)." />
                  </div>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select className="select bg-white/[0.04] border-white/10" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option>Bug</option>
                      <option>Feature request</option>
                      <option>Billing</option>
                      <option>Account</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority (UI)</label>
                    <select className="select bg-white/[0.04] border-white/10" defaultValue="Normal">
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="text-sm font-semibold text-white/85">Attach files</div>
                    <div className="text-xs text-white/50 mt-1">UI only — upload later.</div>
                    <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-3">Upload (UI)</button>
                  </div>
                  <button className="btn-primary px-4 py-3 rounded-xl w-full inline-flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Submit ticket (UI)
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  )
}



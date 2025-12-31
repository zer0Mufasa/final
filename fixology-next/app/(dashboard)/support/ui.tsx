'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import {
  BookOpen,
  MessageSquare,
  Search,
  Ticket,
  Rocket,
  Cloud,
  Wrench,
  Boxes,
  Users,
  LifeBuoy,
  ArrowRight,
} from 'lucide-react'

export function SupportClient() {
  const [query, setQuery] = useState('')

  const topics = useMemo(
    () => [
      { id: 'getting-started', icon: <Rocket className="w-5 h-5" />, title: 'Getting Started', desc: 'Learn how to get started with Fixology' },
      { id: 'integrations', icon: <Cloud className="w-5 h-5" />, title: 'Integrations', desc: 'Learn more about partners and integrations' },
      { id: 'tickets', icon: <Wrench className="w-5 h-5" />, title: 'Tickets', desc: 'Streamline your workflow with ticket tools' },
      { id: 'inventory', icon: <Boxes className="w-5 h-5" />, title: 'Inventory Management', desc: 'Stay organized and manage parts fast' },
      { id: 'team', icon: <Users className="w-5 h-5" />, title: 'Team Management', desc: 'Roles, PINs, and staff best practices' },
      { id: 'guides', icon: <BookOpen className="w-5 h-5" />, title: 'Other Guides', desc: 'More how‑tos across Fixology' },
    ],
    []
  )

  const popular = useMemo(
    () => [
      'How to setup your profile picture',
      'How to time clock whitelist IP feature',
      'How to import customers',
    ],
    []
  )

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => `${t.title} ${t.desc}`.toLowerCase().includes(q))
  }, [query, topics])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-semibold text-white/95 tracking-tight">How can we help?</h1>
          <p className="text-sm text-white/50 mt-2">Choose how you&apos;d like to get support</p>

          <div className="mt-6 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="w-full h-11 pl-11 pr-4 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support options (requested copy) */}
      <section className="space-y-3">
        <div className="text-sm font-medium text-white/80">Choose how you&apos;d like to get support</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SupportOptionCard
            icon={<MessageSquare className="w-5 h-5" aria-hidden="true" />}
            title="Fixo Support Chat"
            desc="Get instant help from our Fixo assistant"
            tone="brand"
            cta="Open chat (UI)"
          />
          <SupportOptionCard
            icon={<BookOpen className="w-5 h-5" aria-hidden="true" />}
            title="Support Center"
            desc="Browse help articles from our knowledge base"
            tone="neutral"
            cta="Browse articles (UI)"
          />
          <SupportOptionCard
            icon={<LifeBuoy className="w-5 h-5" aria-hidden="true" />}
            title="File a Support Ticket"
            desc="Create a ticket for complex issues"
            tone="neutral"
            cta="Create ticket (UI)"
            href="#file-ticket"
          />
        </div>
      </section>

      {/* Topics + Popular */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white/90">Topics</h2>
            <div className="text-xs text-white/40">{filteredTopics.length} topics</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((t) => (
              <button
                key={t.id}
                className="card card-interactive text-left p-5"
                onClick={() => {
                  // UI-only
                  console.log('Open topic (UI):', t.id)
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/70">
                    {t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90">{t.title}</div>
                    <div className="text-xs text-white/50 mt-1">{t.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5">
            <div className="text-sm font-semibold text-white/90 mb-3">Popular</div>
            <div className="space-y-2">
              {popular.map((p) => (
                <button
                  key={p}
                  className="w-full text-left text-sm text-white/70 hover:text-white transition-colors"
                  onClick={() => console.log('Open article (UI):', p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5 border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] to-fuchsia-500/[0.04]">
            <div className="text-sm font-semibold text-white/90">Support Tickets</div>
            <div className="text-xs text-white/60 mt-1">Submit and manage your current support tickets and their status.</div>
            <a href="#file-ticket" className="btn-primary mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl">
              Contact Center
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Ticket form (minimal; UI-only) */}
      <section id="file-ticket" className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-violet-300" aria-hidden="true" />
            <div className="text-sm font-semibold text-white/90">File a Support Ticket (UI)</div>
          </div>
          <Link href="/support" className="text-xs text-white/50 hover:text-white/70 transition-colors">
            Back to top
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-3">
            <label className="block">
              <span className="text-xs text-white/50">Subject</span>
              <input className="input mt-1" placeholder="e.g., Ticket list is not loading" />
            </label>
            <label className="block">
              <span className="text-xs text-white/50">Details</span>
              <textarea className="input mt-1 min-h-[140px] resize-none" placeholder="Steps to reproduce + what you expected (UI-only)." />
            </label>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <label className="block">
              <span className="text-xs text-white/50">Category</span>
              <select className="input mt-1">
                <option>Bug</option>
                <option>Feature request</option>
                <option>Billing</option>
                <option>Account</option>
                <option>Other</option>
              </select>
            </label>
            <button className="btn-primary w-full px-4 py-2.5 rounded-xl">Submit ticket (UI)</button>
            <div className="text-[11px] text-white/40">
              This is UI-only right now. Later this will create a ticket and track status.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SupportOptionCard({
  icon,
  title,
  desc,
  cta,
  href,
  tone,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  cta: string
  href?: string
  tone: 'brand' | 'neutral'
}) {
  const inner = (
    <div className={cn('card p-5 h-full', tone === 'brand' && 'border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] to-fuchsia-500/[0.04]')}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center', tone === 'brand' ? 'bg-violet-500/15 border-violet-500/25 text-violet-200' : 'bg-white/[0.04] border-white/[0.08] text-white/70')}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="text-xs text-white/55 mt-1">{desc}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className={cn('inline-flex items-center gap-2 text-xs font-medium', tone === 'brand' ? 'text-violet-200' : 'text-white/70')}>
          {cta} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </div>
    </div>
  )

  if (href) return <a href={href} className="block">{inner}</a>
  return (
    <button
      className="block text-left"
      onClick={() => {
        // UI only
        console.log('Support option (UI):', title)
      }}
    >
      {inner}
    </button>
  )
}



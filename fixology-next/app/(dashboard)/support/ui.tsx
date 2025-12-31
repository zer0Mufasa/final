'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Cloud,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  Rocket,
  Search,
  Send,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react'

export function SupportClient() {
  const [query, setQuery] = useState('')

  // Ticket form (UI-only)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<'Bug' | 'Billing' | 'Account' | 'Other'>('Bug')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const topics = useMemo(
    () => [
      { id: 'getting-started', icon: <Rocket className="w-5 h-5" />, title: 'Getting Started', desc: 'Learn how to get started with Fixology' },
      { id: 'integrations', icon: <Cloud className="w-5 h-5" />, title: 'Integrations', desc: 'Learn more about partners and integrations' },
      { id: 'tickets', icon: <Wrench className="w-5 h-5" />, title: 'Tickets', desc: 'How to streamline workflow with integrated tools' },
      { id: 'inventory', icon: <Boxes className="w-5 h-5" />, title: 'Inventory Management', desc: 'Learn to stay organized and manage inventory' },
      { id: 'team', icon: <Users className="w-5 h-5" />, title: 'Team Management', desc: 'Information about collaborating and chatting with your team' },
      { id: 'guides', icon: <BookOpen className="w-5 h-5" />, title: 'Other Guides', desc: 'More guides about Fixology' },
    ],
    []
  )

  const popular = useMemo(
    () => ['How To Setup Your Profile Picture', 'How to Time Clock Whitelist IP Feature', 'How to Import Customers'],
    []
  )

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => `${t.title} ${t.desc}`.toLowerCase().includes(q))
  }, [query, topics])

  const minChars = 10
  const trimmedLen = message.trim().length
  const canSubmit = Boolean(name.trim() && email.trim() && title.trim() && trimmedLen >= minChars)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="pt-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-semibold text-white/95 tracking-tight">How can we help you?</h1>
          <p className="text-sm text-white/50 mt-2">Choose how you&apos;d like to get support</p>

          <div className="mt-6 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Articles..."
                className="w-full h-11 pl-11 pr-4 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topics + Popular */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white/90">Topics</h2>
            <div className="h-px flex-1 mx-4 bg-white/[0.06]" />
            <div className="text-xs text-white/40">{filteredTopics.length} topics</div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((t) => (
              <button
                key={t.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all text-left p-4"
                onClick={() => console.log('Open topic (UI):', t.id)}
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
          <div className="card p-6">
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

          <div className="card p-6 border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] to-fuchsia-500/[0.04]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Ticket className="w-4 h-4 text-violet-200" aria-hidden="true" />
              Support Tickets
            </div>
            <div className="text-sm text-white/65 mt-2">
              Submit and manage your current support tickets and their status.
            </div>
            <a
              href="#contact-support"
              className="btn-primary mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl"
            >
              Contact Center
            </a>
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
            cta="Create a ticket"
            href="#contact-support"
          />
        </div>
      </section>

      {/* Contact Support form */}
      <section id="contact-support" className="card p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-lg font-semibold text-white/90">Contact Support</div>
            <div className="text-sm text-white/55 mt-1">
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </div>
          </div>
          <Link href="/support" className="text-xs text-white/50 hover:text-white/70 transition-colors">
            Back to top
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: fields */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Personal Information</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="input"
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@company.com"
                    className="input"
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Ticket Details</div>
              <div className="mt-3 grid gap-4">
                <Field label="Category">
                  <select className="input" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                    <option>Bug</option>
                    <option>Billing</option>
                    <option>Account</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="input"
                  />
                </Field>

                <Field label="Message">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your message here... (minimum 10 characters)"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all min-h-[160px] resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={cn(trimmedLen >= minChars ? 'text-white/40' : 'text-amber-300')}>
                      {trimmedLen} / {minChars} characters (minimum)
                    </span>
                    <span className="text-white/30">UI-only</span>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Right: attachments + submit */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-5">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-white/60" aria-hidden="true" />
                <div className="text-sm font-semibold text-white/85">Attachments (optional)</div>
              </div>
              <div className="text-xs text-white/50 mt-2">Choose files or drag and drop</div>

              <div className="mt-4 rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] p-5 text-center">
                <div className="text-sm text-white/70">Choose files or drag and drop</div>
                <div className="text-xs text-white/40 mt-1">
                  Images (PNG, JPG, WEBP), Videos (MP4, MOV), Audio (MP3, WAV), PDFs, CSVs
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,audio/mpeg,audio/wav,application/pdf,text/csv"
                />
                <button type="button" className="btn-secondary mt-4 px-4 py-2.5 rounded-xl" onClick={() => fileRef.current?.click()}>
                  Choose files (UI)
                </button>
              </div>
            </div>

            <button
              className={cn(
                'btn-primary w-full px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2',
                !canSubmit && 'opacity-60 cursor-not-allowed'
              )}
              disabled={!canSubmit}
              onClick={() => console.log('Submit Support Ticket (UI)')}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              Submit Support Ticket
            </button>

            <div className="text-[11px] text-white/40">UI-only right now. Later this will create a support ticket and track status.</div>
          </div>
        </div>
      </section>

      <div className="text-xs text-white/40 flex items-center gap-2">
        <Ticket className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
        Create a ticket
      </div>
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
    <>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-11 h-11 rounded-2xl border flex items-center justify-center',
            tone === 'brand' ? 'bg-white/[0.04] border-violet-500/25 text-violet-200' : 'bg-white/[0.04] border-white/[0.06] text-white/70'
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="text-xs text-white/55 mt-0.5">{desc}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className={cn('w-full h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2', tone === 'brand' ? 'btn-primary' : 'btn-secondary')}>
          {cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          'rounded-3xl border p-5 transition-all block',
          tone === 'brand'
            ? 'border-violet-500/25 bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.06]'
            : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10]'
        )}
      >
        {inner}
      </a>
    )
  }

  return (
    <div
      className={cn(
        'rounded-3xl border p-5 transition-all',
        tone === 'brand'
          ? 'border-violet-500/25 bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.06]'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10]'
      )}
    >
      {inner}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1">{children}</div>
    </label>
  )
}


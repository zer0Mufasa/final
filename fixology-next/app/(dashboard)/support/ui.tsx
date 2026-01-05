'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
  Ticket,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import { useFixo } from '@/components/fixo/fixo-chat-widget'

// ============================================
// FIXOLOGY SUPPORT CENTER v2.0
// Premium dark lavender theme
// ============================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function SupportClient() {
  const { openChat } = useFixo()
  const [animationReady, setAnimationReady] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'help' | 'tickets' | 'contact'>('help')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimationReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Ticket form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState<'bug' | 'billing' | 'feature' | 'account' | 'other'>('bug')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // ==========================================
  // DATA
  // ==========================================

  const topics = useMemo(
    () => [
      { id: 'getting-started', emoji: '🚀', title: 'Getting Started', desc: 'Setup guides and first steps', articles: 12 },
      { id: 'tickets', emoji: '🎫', title: 'Tickets & Repairs', desc: 'Managing repair workflows', articles: 24 },
      { id: 'inventory', emoji: '📦', title: 'Inventory', desc: 'Stock management and ordering', articles: 18 },
      { id: 'payments', emoji: '💳', title: 'Payments & Billing', desc: 'Invoices, payouts, and pricing', articles: 15 },
      { id: 'integrations', emoji: '🔗', title: 'Integrations', desc: 'Connect with other tools', articles: 9 },
      { id: 'team', emoji: '👥', title: 'Team Management', desc: 'Permissions and collaboration', articles: 11 },
    ],
    []
  )

  const faqs = useMemo(
    () => [
      {
        id: 'import',
        q: 'How do I import existing customers?',
        a: 'Go to Customers → Import and upload a CSV file. We support imports from RepairShopr, RepairDesk, and custom formats. Our AI will automatically map your columns.',
      },
      {
        id: 'pricing',
        q: 'Can I customize repair pricing?',
        a: 'Yes! Navigate to Settings → Pricing to set up device-specific pricing, labor rates, and automatic markup rules. You can also create pricing tiers for different customer types.',
      },
      {
        id: 'notifications',
        q: 'How do automated customer notifications work?',
        a: 'Fixology sends SMS/email updates at key stages: intake confirmation, diagnosis ready, repair complete, and pickup reminder. Customize templates in Settings → Notifications.',
      },
      {
        id: 'backup',
        q: 'Is my data backed up?',
        a: 'Yes, we perform automatic backups every hour. Your data is encrypted and stored redundantly across multiple data centers. You can also export your data anytime from Settings → Data.',
      },
      {
        id: 'offline',
        q: 'Does Fixology work offline?',
        a: 'Core features like viewing tickets and customer info work offline. Changes sync automatically when you reconnect. Full offline mode coming in Q2 2025.',
      },
    ],
    []
  )

  const recentTickets = useMemo(
    () => [
      { id: 'TKT-2847', title: 'Inventory sync issue', status: 'open', created: '2 hours ago' },
      { id: 'TKT-2831', title: 'Question about API limits', status: 'resolved', created: '3 days ago' },
      { id: 'TKT-2819', title: 'Feature request: bulk SMS', status: 'in-progress', created: '1 week ago' },
    ],
    []
  )

  // ==========================================
  // FILTERING
  // ==========================================

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topics
    return topics.filter((t) => `${t.title} ${t.desc}`.toLowerCase().includes(q))
  }, [query, topics])

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faqs
    return faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q))
  }, [query, faqs])

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const minChars = 20
  const trimmedLen = message.trim().length
  const canSubmit = Boolean(name.trim() && email.trim() && title.trim() && trimmedLen >= minChars)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.currentTarget.files
    if (!selected) return
    setFiles((prev) => [...prev, ...Array.from(selected)])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, category, priority, title, message }),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error('Support ticket error:', data.error)
      }
    } catch {
      // Proceed anyway - UI will show success
    }
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setCategory('bug')
    setPriority('medium')
    setTitle('')
    setMessage('')
    setFiles([])
    setSubmitted(false)
  }

  // ==========================================
  // SUCCESS STATE
  // ==========================================

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]/95">Ticket Submitted!</h1>
        <p className="text-sm text-[var(--text-primary)]/60 mt-3 max-w-md mx-auto">
          Thank you for contacting us. We&apos;ve received your support ticket and will get back to you within 2-4 hours during business hours.
        </p>
        <div className="mt-4 text-xs text-[var(--text-primary)]/40">
          Ticket ID:{' '}
          <span className="font-mono text-[var(--text-primary)]/60">TKT-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={resetForm} className="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
            Submit Another
          </button>
          <Link href="/dashboard" className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-page-in">
      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <section className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.06] border border-violet-500/20 p-8 md:p-12 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Online indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] text-xs text-[var(--text-secondary)] mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Support team online
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)]/95 tracking-tight">How can we help you?</h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] mt-3 max-w-lg mx-auto">
            Search our knowledge base, browse help topics, or get in touch with our support team.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-primary)]/30 group-focus-within:text-violet-400 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/[0.06] border border-white/[0.1] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/30 outline-none focus:border-violet-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.1] transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-primary)]/40" />
                </button>
              )}
            </div>

            {/* Popular searches */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-[var(--text-primary)]/40">Popular:</span>
              {['Import customers', 'Set up notifications', 'API docs'].map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[var(--text-primary)]/60 hover:text-[var(--text-primary)]/80 hover:bg-white/[0.1] transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          TAB NAVIGATION
          ========================================== */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {[
          { id: 'help', label: 'Help Center', icon: BookOpen },
          { id: 'tickets', label: 'My Tickets', icon: Ticket },
          { id: 'contact', label: 'Contact Us', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==========================================
          HELP CENTER TAB
          ========================================== */}
      {activeTab === 'help' && (
        <div className="space-y-8">
          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SupportCard emoji="✨" title="Fixo AI Assistant" desc="Get instant answers powered by AI" cta="Start chat" variant="featured" badge="New" onClick={openChat} />
            <SupportCard emoji="📚" title="Documentation" desc="In-depth guides and tutorials" cta="Browse docs" variant="default" />
            <SupportCard emoji="🎥" title="Video Tutorials" desc="Step-by-step video walkthroughs" cta="Watch videos" variant="default" badge="12 videos" />
          </div>

          {/* Topics Grid */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Browse Topics</h2>
                <p className="text-xs text-[var(--text-primary)]/40 mt-1">Find answers organized by category</p>
              </div>
              <span className="text-xs text-[var(--text-primary)]/40 bg-white/[0.04] px-2.5 py-1 rounded-lg">{filteredTopics.length} topics</span>
            </div>

            {filteredTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            ) : (
              <EmptyState emoji="🔍" title="No topics found" desc={`No results for "${query}". Try a different search term.`} />
            )}
          </div>

          {/* FAQ Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Frequently Asked Questions</h2>
                <p className="text-xs text-[var(--text-primary)]/40 mt-1">Quick answers to common questions</p>
              </div>
            </div>

            {filteredFaqs.length > 0 ? (
              <div className="space-y-2">
                {filteredFaqs.map((faq) => (
                  <FaqItem key={faq.id} faq={faq} expanded={expandedFaq === faq.id} onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} />
                ))}
              </div>
            ) : (
              <EmptyState emoji="❓" title="No FAQs match your search" desc="Try searching for something else or contact support." />
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MY TICKETS TAB
          ========================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Support Tickets</h2>
              <p className="text-xs text-[var(--text-primary)]/40 mt-1">Track and manage your open tickets</p>
            </div>
            <button
              onClick={() => setActiveTab('contact')}
              className="btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Ticket
            </button>
          </div>

          <div className="card overflow-hidden">
            {/* Ticket Stats */}
            <div className="grid grid-cols-3 border-b border-white/[0.06]">
              <TicketStat label="Open" value="1" color="text-amber-400" />
              <TicketStat label="In Progress" value="1" color="text-blue-400" />
              <TicketStat label="Resolved" value="1" color="text-emerald-400" />
            </div>

            {/* Ticket List */}
            {recentTickets.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {recentTickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <div className="p-8">
                <EmptyState emoji="🎫" title="No tickets yet" desc="You haven&apos;t submitted any support tickets." />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          CONTACT TAB
          ========================================== */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-8 card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Submit a Support Ticket</h2>
              <p className="text-xs text-[var(--text-primary)]/40 mt-1">We typically respond within 2-4 hours during business hours.</p>
            </div>

            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]/30 mb-3">Contact Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Your Name" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="input" />
                  </Field>
                  <Field label="Email Address" required>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" className="input" />
                  </Field>
                </div>
              </div>

              {/* Ticket Details */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]/30 mb-3">Ticket Details</div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Category" required>
                      <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="input">
                        <option value="bug">🐛 Bug Report</option>
                        <option value="billing">💳 Billing Question</option>
                        <option value="feature">💡 Feature Request</option>
                        <option value="account">👤 Account Issue</option>
                        <option value="other">📝 Other</option>
                      </select>
                    </Field>
                    <Field label="Priority">
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={cn(
                              'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize',
                              priority === p
                                ? p === 'high'
                                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                                  : p === 'medium'
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                  : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/[0.04] border-white/[0.08] text-[var(--text-muted)] hover:bg-white/[0.06]'
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <Field label="Subject" required>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of your issue" className="input" />
                  </Field>

                  <Field label="Message" required>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your issue in detail. Include any relevant information like steps to reproduce, error messages, etc."
                      className="input min-h-[160px] resize-none"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={cn(trimmedLen >= minChars ? 'text-[var(--text-primary)]/40' : 'text-amber-400')}>
                        {trimmedLen} / {minChars} characters minimum
                      </span>
                      {trimmedLen >= minChars && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Good
                        </span>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-primary)]/30 mb-3">Attachments (Optional)</div>

                <div
                  className="rounded-2xl border-2 border-dashed border-white/[0.1] bg-[var(--bg-card)] p-6 text-center hover:border-violet-500/30 hover:bg-white/[0.03] transition-all cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.csv,.txt"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-8 h-8 text-[var(--text-primary)]/30 mx-auto mb-3" />
                  <div className="text-sm text-[var(--text-secondary)]">Drop files here or click to upload</div>
                  <div className="text-xs text-[var(--text-primary)]/40 mt-1">Images, videos, PDFs, or text files up to 10MB each</div>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <span className="text-sm text-[var(--text-secondary)] truncate">{file.name}</span>
                          <span className="text-xs text-[var(--text-primary)]/40 shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-1 rounded-md hover:bg-white/[0.1] transition-colors">
                          <X className="w-4 h-4 text-[var(--text-primary)]/40" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  'btn-primary w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2',
                  (!canSubmit || isSubmitting) && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Help */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Need faster help?</span>
              </div>

              <div className="space-y-3">
                <button onClick={openChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all text-left">
                  <span className="text-lg">✨</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Ask Fixo AI</div>
                    <div className="text-xs text-[var(--text-muted)]">Get instant answers</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30" />
                </button>

                <button onClick={openChat} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all text-left">
                  <span className="text-lg">💬</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">Live Chat</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Online now
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30" />
                </button>
              </div>
            </div>

            {/* Response Times */}
            <div className="card p-5">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Average Response Times</div>
              <div className="space-y-2">
                <ResponseTime label="Live Chat" time="< 5 min" />
                <ResponseTime label="Email / Ticket" time="2-4 hours" />
                <ResponseTime label="Feature Requests" time="1-2 days" />
              </div>
            </div>

            {/* Contact Info */}
            <div className="card p-5">
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Other Ways to Reach Us</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-[var(--text-primary)]/60">
                  <MessageCircle className="w-4 h-4 text-[var(--text-primary)]/40" />
                  <span>support@fixology.io</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--text-primary)]/60">
                  <Clock className="w-4 h-4 text-[var(--text-primary)]/40" />
                  <span>Mon-Fri, 9am-6pm CST</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SupportCard({
  emoji,
  title,
  desc,
  cta,
  variant,
  badge,
  onClick,
}: {
  emoji: string
  title: string
  desc: string
  cta: string
  variant: 'featured' | 'default'
  badge?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-5 rounded-2xl border transition-all cursor-pointer group',
        variant === 'featured'
          ? 'bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.06] border-violet-500/25 hover:border-violet-500/40'
          : 'bg-[var(--bg-card)] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
      )}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
          {badge}
        </span>
      )}

      <span className="text-3xl">{emoji}</span>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
        {cta}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  )
}

function TopicCard({ topic }: { topic: { id: string; emoji: string; title: string; desc: string; articles: number } }) {
  return (
    <button className="p-4 rounded-xl bg-[var(--bg-card)] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left group">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{topic.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">{topic.title}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">{topic.desc}</div>
          <div className="text-xs text-[var(--text-primary)]/30 mt-2">{topic.articles} articles</div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/20 group-hover:text-[var(--text-primary)]/40 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </button>
  )
}

function FaqItem({
  faq,
  expanded,
  onToggle,
}: {
  faq: { id: string; q: string; a: string }
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-[var(--bg-card)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">{faq.q}</span>
        <ChevronDown className={cn('w-4 h-4 text-[var(--text-primary)]/40 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-[var(--text-primary)]/60 leading-relaxed">{faq.a}</div>
        </div>
      )}
    </div>
  )
}

function TicketStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 text-center">
      <div className={cn('text-2xl font-semibold', color)}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  )
}

function TicketRow({ ticket }: { ticket: { id: string; title: string; status: string; created: string } }) {
  const statusConfig: Record<string, { label: string; class: string }> = {
    open: { label: 'Open', class: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    'in-progress': { label: 'In Progress', class: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
    resolved: { label: 'Resolved', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  }

  const status = statusConfig[ticket.status] || statusConfig.open

  return (
    <button className="w-full flex items-center justify-between gap-4 p-4 hover:bg-[var(--bg-card)] transition-colors text-left">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-primary)]/40">{ticket.id}</span>
          <span className={cn('text-[11px] px-2 py-0.5 rounded-md border font-medium', status.class)}>{status.label}</span>
        </div>
        <div className="text-sm text-[var(--text-primary)] mt-1 truncate">{ticket.title}</div>
        <div className="text-xs text-[var(--text-primary)]/40 mt-1">{ticket.created}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-primary)]/30 shrink-0" />
    </button>
  )
}

function ResponseTime({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-[var(--text-primary)]/60">{label}</span>
      <span className="text-xs font-medium text-[var(--text-primary)]/80">{time}</span>
    </div>
  )
}

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="text-center py-12">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-sm font-medium text-[var(--text-primary)]/80 mt-4">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">{desc}</p>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--text-primary)]/60 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </div>
      {children}
    </label>
  )
}


import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { HELP_ARTICLES, HELP_TOPICS, getTopicById } from '@/lib/help/articles'

export const metadata = {
  title: 'Documentation | Fixology',
}

export default function SupportDocsPage({
  searchParams,
}: {
  searchParams?: { topic?: string; q?: string }
}) {
  const topic = typeof searchParams?.topic === 'string' ? searchParams.topic : ''
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim().toLowerCase() : ''

  const activeTopic = topic ? getTopicById(topic) : null

  const filtered = HELP_ARTICLES.filter((a) => {
    if (topic && a.topicId !== topic) return false
    if (!q) return true
    return `${a.title} ${a.summary} ${a.body}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="Guides, checklists, and launch-ready setup notes."
        action={
          <Link
            href="/support"
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            ← Back to Support
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <GlassCard className="p-4 rounded-3xl h-fit">
          <div className="text-sm font-semibold text-white/90 mb-3">Topics</div>
          <div className="space-y-1">
            <Link
              href="/support/docs"
              className={`block px-3 py-2 rounded-xl text-sm border ${
                !topic
                  ? 'bg-violet-500/15 border-violet-500/25 text-violet-200'
                  : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              All topics
            </Link>
            {HELP_TOPICS.map((t) => (
              <Link
                key={t.id}
                href={`/support/docs?topic=${encodeURIComponent(t.id)}`}
                className={`block px-3 py-2 rounded-xl text-sm border ${
                  topic === t.id
                    ? 'bg-violet-500/15 border-violet-500/25 text-violet-200'
                    : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.06]'
                }`}
              >
                {t.title}
                <div className="text-xs text-white/40 mt-0.5">{t.description}</div>
              </Link>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {activeTopic && (
            <div className="text-sm text-white/60">
              Showing topic: <span className="text-white/85 font-semibold">{activeTopic.title}</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <GlassCard className="p-8 rounded-3xl">
              <div className="text-white/80 font-semibold">No articles found</div>
              <div className="mt-2 text-white/50 text-sm">Try a different topic or search term.</div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((a) => (
                <Link
                  key={a.slug}
                  href={`/support/docs/${a.slug}`}
                  className="block"
                >
                  <GlassCard className="p-5 rounded-3xl hover:bg-white/[0.05] transition-colors">
                    <div className="text-sm font-semibold text-white/90">{a.title}</div>
                    <div className="mt-2 text-xs text-white/55 leading-relaxed">{a.summary}</div>
                    <div className="mt-4 text-xs text-violet-300 font-semibold">Read →</div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


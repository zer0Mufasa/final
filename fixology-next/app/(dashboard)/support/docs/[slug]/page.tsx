import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { getArticleBySlug, getTopicById } from '@/lib/help/articles'

export default function SupportDocArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) return notFound()

  const topic = getTopicById(article.topicId)
  const blocks = article.body.split('\n\n').map((b) => b.trim()).filter(Boolean)

  return (
    <div className="space-y-6">
      <PageHeader
        title={article.title}
        description={topic ? topic.title : undefined}
        action={
          <Link
            href="/support/docs"
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            ← Back to docs
          </Link>
        }
      />

      <GlassCard className="p-6 rounded-3xl">
        <div className="space-y-4 text-sm text-white/75 leading-relaxed">
          {blocks.map((b, idx) => (
            <div key={idx} className="whitespace-pre-wrap">
              {b}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}


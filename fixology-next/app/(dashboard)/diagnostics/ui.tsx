'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ReticleIcon, ReticleLoader } from '@/components/shared/reticle-icon'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  ClipboardList,
  ShieldAlert,
  Sparkles,
  Printer,
  Save,
  ExternalLink,
} from 'lucide-react'

interface DiagResult {
  cause: string
  confidence: number
  nextSteps: string[]
  warnings: string[]
  sources?: string[]
  usedRepairWiki?: boolean
}

export function DiagnosticsClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<DiagResult | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    }, 450)
    return () => clearTimeout(t)
  }, [])

  const run = async () => {
    if (!prompt.trim()) {
      toast.error('Describe the issue first')
      return
    }

    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType: 'Smartphone',
          brand: 'Unknown',
          model: undefined,
          symptoms: [],
          issueDescription: prompt.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to analyze')
      }

      const data = await res.json()

      const mapped: DiagResult = {
        cause: data?.primaryCause || (data?.likelyCauses?.[0]?.cause ?? 'Unknown issue'),
        confidence: Math.max(0, Math.min(1, Number(data?.overallConfidence ?? data?.confidence ?? 0) / 100)),
        nextSteps: Array.isArray(data?.recommendedTests) ? data.recommendedTests : Array.isArray(data?.steps) ? data.steps : [],
        warnings: Array.isArray(data?.warnings) ? data.warnings : Array.isArray(data?.riskFlags) ? data.riskFlags : [],
        sources: Array.isArray(data?.sources) ? data.sources : undefined,
        usedRepairWiki: data?.usedRepairWiki || false,
      }

      setResult(mapped)
      toast.success('AI analysis ready')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to analyze')
    } finally {
      setAnalyzing(false)
    }
  }

  const actionButtons = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        leftIcon={<Printer className="w-4 h-4" />}
        onClick={() => {
          try {
            window.print()
          } catch {
            toast.error('Print not available')
          }
        }}
      >
        Print Report
      </Button>
      <Button
        leftIcon={<Save className="w-4 h-4" />}
        onClick={() => {
          const payload = {
            createdAt: new Date().toISOString(),
            aiPrompt: prompt,
            aiResult: result,
          }
          try {
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `diagnostics-${Date.now()}.json`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success('Downloaded diagnostics JSON')
          } catch {
            toast.error('Failed to save results')
          }
        }}
      >
        Save Results
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Diagnostics"
          description="AI-powered diagnostic analysis and recommendations."
          action={actionButtons}
        />
      </div>

      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-[var(--border-default)] flex items-center justify-center">
                <ReticleIcon size="md" color="purple" variant="idle" className="opacity-90" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Describe the problem</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Short is best: device + symptom + what changed.</div>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-[220px] rounded-2xl" />
              ) : (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--bg-input)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-primary)]/85 placeholder:text-[var(--text-primary)]/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[220px]"
                  placeholder='e.g., "iPhone 14 Pro — cracked display. Touch works but there is a black spot. Customer says it started after a drop."'
                />
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button className="btn-primary px-4 py-3 rounded-xl inline-flex items-center gap-2" onClick={run} disabled={analyzing}>
                <Sparkles className="w-4 h-4" />
                Analyze
              </button>
              <button className="btn-secondary px-4 py-3 rounded-xl" onClick={() => setPrompt('')}>
                Clear
              </button>
            </div>
          </GlassCard>

          <GlassCard className="rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">AI Analysis Results</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Powered by Fixology AI • repair.wiki knowledge base</div>
              </div>
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-[260px] rounded-2xl" />
              ) : analyzing ? (
                <div className="py-10 flex items-center justify-center">
                  <ReticleLoader size="lg" color="purple" text="Fixology analyzing..." />
                </div>
              ) : result ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                    <div className="text-xs uppercase tracking-wider text-[var(--text-primary)]/45 font-semibold">Likely cause</div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]/85 mt-1">{result.cause}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                      </div>
                      <div className="text-xs text-[var(--text-primary)]/55">{Math.round(result.confidence * 100)}%</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <ClipboardList className="w-4 h-4 text-purple-300" />
                      Next steps
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {result.nextSteps.map((s) => (
                        <div key={s} className="text-sm text-[var(--text-secondary)]">• {s}</div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <ShieldAlert className="w-4 h-4 text-yellow-300" />
                      Warnings
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {result.warnings.map((w) => (
                        <div key={w} className="text-sm text-[var(--text-secondary)]">• {w}</div>
                      ))}
                    </div>
                  </div>

                  {/* Sources */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <ExternalLink className="w-4 h-4 text-purple-300" />
                        Knowledge Sources
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {result.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">{source.replace('https://repair.wiki/w/', 'repair.wiki/')}</span>
                          </a>
                        ))}
                      </div>
                      {result.usedRepairWiki && (
                        <div className="mt-2 text-xs text-[var(--text-muted)]">
                          Information sourced from repair.wiki knowledge base
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl bg-white/[0.03] border border-[var(--border-default)] p-6 text-sm text-[var(--text-primary)]/60 leading-relaxed text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-400/40" />
                  Describe the issue above and click Analyze to get AI-powered diagnostic suggestions.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

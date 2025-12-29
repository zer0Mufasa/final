'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ReticleIcon, ReticleLoader } from '@/components/shared/reticle-icon'
import { ArrowRight, ClipboardList, ShieldAlert, Sparkles } from 'lucide-react'

type Result = {
  cause: string
  confidence: number
  nextSteps: string[]
  warnings: string[]
  parts: string[]
}

export function DiagnosticsClient() {
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
  }, [])

  const mockResult: Result = useMemo(
    () => ({
      cause: 'Impact damage to display assembly (likely)',
      confidence: 0.82,
      nextSteps: [
        'Inspect frame for bend and verify touch grid',
        'Replace screen + adhesive, then test True Tone / brightness',
        'Run final QA: touch, camera, speaker, charge',
      ],
      warnings: [
        'Black spot may expand during repair (OLED bleed)',
        'Confirm backups before invasive work',
      ],
      parts: ['iPhone 14 Pro Screen (OEM)', 'Adhesive kit', 'Isopropyl wipes'],
    }),
    []
  )

  const run = async () => {
    setAnalyzing(true)
    setResult(null)
    // UI-only delay
    setTimeout(() => {
      setResult(mockResult)
      setAnalyzing(false)
    }, 900)
  }

  return (
    <div>
      <PageHeader
        title="Diagnostics"
        description="A calm console: describe the problem, get a structured diagnosis draft, and follow a clean repair checklist."
        action={
          <Button rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />} onClick={run}>
            Run Diagnostic (UI)
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <ReticleIcon size="md" color="purple" variant="idle" className="opacity-90" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">Describe the problem</div>
              <div className="text-xs text-white/50 mt-0.5">Short is best: device + symptom + what changed.</div>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[220px] rounded-2xl" />
            ) : (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[220px]"
                placeholder='e.g., “iPhone 14 Pro — cracked display. Touch works but there’s a black spot. Customer says it started after a drop.”'
              />
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button className="btn-primary px-4 py-3 rounded-xl inline-flex items-center gap-2" onClick={run} disabled={analyzing}>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Analyze (UI)
            </button>
            <button className="btn-secondary px-4 py-3 rounded-xl" onClick={() => setPrompt('')}>
              Clear
            </button>
          </div>
        </GlassCard>

        <GlassCard className="rounded-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Results</div>
              <div className="text-xs text-white/50 mt-0.5">Mock output — we’ll wire the engine later.</div>
            </div>
            <div className="badge bg-white/5 text-white/55 border border-white/10">UI only</div>
          </div>

          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[260px] rounded-2xl" />
            ) : analyzing ? (
              <div className="py-10 flex items-center justify-center">
                <ReticleLoader size="lg" color="purple" text="Fixology analyzing…" />
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">Likely cause</div>
                  <div className="text-sm font-semibold text-white/85 mt-1">{result.cause}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                    </div>
                    <div className="text-xs text-white/55">{Math.round(result.confidence * 100)}%</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <ClipboardList className="w-4 h-4 text-purple-300" aria-hidden="true" />
                    Next steps
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {result.nextSteps.map((s) => (
                      <div key={s} className="text-sm text-white/70">• {s}</div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                    <ShieldAlert className="w-4 h-4 text-yellow-300" aria-hidden="true" />
                    Warnings
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {result.warnings.map((w) => (
                      <div key={w} className="text-sm text-white/70">• {w}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 text-sm text-white/60 leading-relaxed">
                Run a diagnostic to populate structured results: cause, confidence, next steps, warnings, and suggested parts.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <GlassCard className="rounded-3xl">
          <div className="text-sm font-semibold text-white/90">Repair guidance checklist</div>
          <div className="text-xs text-white/50 mt-1">UI-only checklist — designed to feel like a real workflow.</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Confirm backups & waiver',
              'Inspect frame & water indicators',
              'Order/allocate parts',
              'Perform repair & seal',
              'Run QA + calibration',
              'Send customer update',
            ].map((x, i) => (
              <label key={x} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/[0.05] transition-colors">
                <span className="text-sm text-white/80">{x}</span>
                <input type="checkbox" defaultChecked={i === 0} className="accent-[#a78bfa]" />
              </label>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}



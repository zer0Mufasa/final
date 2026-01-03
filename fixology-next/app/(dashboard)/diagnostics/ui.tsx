'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Button } from '@/components/ui/button'
import { ReticleIcon, ReticleLoader } from '@/components/shared/reticle-icon'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  ClipboardList,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Smartphone,
  Battery,
  Wifi,
  Volume2,
  Camera,
  Fingerprint,
  Monitor,
  ChevronDown,
  ChevronRight,
  Printer,
  Save,
  RotateCcw,
} from 'lucide-react'

type ConditionGrade = 'A' | 'B' | 'C' | 'D' | 'F' | null
type TestResult = 'pass' | 'fail' | 'skip' | null

interface DiagnosticTest {
  id: string
  name: string
  description: string
  category: string
  result: TestResult
}

interface DiagResult {
  cause: string
  confidence: number
  nextSteps: string[]
  warnings: string[]
}

const gradeDescriptions: Record<string, { label: string; color: string; description: string }> = {
  A: { label: 'Excellent', color: 'emerald', description: 'Like new condition, no visible wear' },
  B: { label: 'Good', color: 'green', description: 'Minor wear, fully functional' },
  C: { label: 'Fair', color: 'amber', description: 'Visible wear, works with issues' },
  D: { label: 'Poor', color: 'orange', description: 'Significant damage, limited function' },
  F: { label: 'Non-Functional', color: 'red', description: 'Major failure, needs repair' },
}

const defaultTests: DiagnosticTest[] = [
  { id: 't1', name: 'Display brightness', description: 'Min/max brightness test', category: 'Display', result: null },
  { id: 't2', name: 'Touch response', description: 'Multi-touch grid test', category: 'Display', result: null },
  { id: 't3', name: 'Dead pixels', description: 'Full screen color test', category: 'Display', result: null },
  { id: 't4', name: 'True Tone / Auto-brightness', description: 'Sensor calibration check', category: 'Display', result: null },
  { id: 't5', name: 'Earpiece speaker', description: 'Call audio test', category: 'Audio', result: null },
  { id: 't6', name: 'Loudspeaker', description: 'Media playback test', category: 'Audio', result: null },
  { id: 't7', name: 'Microphones', description: 'Voice recording test', category: 'Audio', result: null },
  { id: 't8', name: 'Wi-Fi', description: 'Network connection test', category: 'Connectivity', result: null },
  { id: 't9', name: 'Cellular signal', description: 'SIM detection and signal', category: 'Connectivity', result: null },
  { id: 't10', name: 'Bluetooth', description: 'Device pairing test', category: 'Connectivity', result: null },
  { id: 't11', name: 'GPS / Location', description: 'Location accuracy test', category: 'Connectivity', result: null },
  { id: 't12', name: 'Rear camera', description: 'Photo and video capture', category: 'Camera', result: null },
  { id: 't13', name: 'Front camera', description: 'Selfie and FaceTime test', category: 'Camera', result: null },
  { id: 't14', name: 'Flash / Torch', description: 'LED flash test', category: 'Camera', result: null },
  { id: 't15', name: 'Battery health', description: 'Capacity and cycle count', category: 'Battery', result: null },
  { id: 't16', name: 'Charging port', description: 'Wired charging test', category: 'Battery', result: null },
  { id: 't17', name: 'Wireless charging', description: 'Qi charging test', category: 'Battery', result: null },
  { id: 't18', name: 'Face ID / Touch ID', description: 'Biometric authentication', category: 'Sensors', result: null },
  { id: 't19', name: 'Accelerometer / Gyro', description: 'Motion sensor test', category: 'Sensors', result: null },
  { id: 't20', name: 'Volume buttons', description: 'Button response test', category: 'Sensors', result: null },
  { id: 't21', name: 'Power button', description: 'Button response test', category: 'Sensors', result: null },
  { id: 't22', name: 'Silent switch', description: 'Mute toggle test', category: 'Sensors', result: null },
]

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'Display': return Monitor
    case 'Audio': return Volume2
    case 'Connectivity': return Wifi
    case 'Camera': return Camera
    case 'Battery': return Battery
    case 'Sensors': return Fingerprint
    default: return Smartphone
  }
}

export function DiagnosticsClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [tab, setTab] = useState<'checklist' | 'grading' | 'ai'>('checklist')
  const [prompt, setPrompt] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<DiagResult | null>(null)
  const [tests, setTests] = useState<DiagnosticTest[]>(defaultTests)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Display', 'Audio']))
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>(null)
  const [cosmeticNotes, setCosmeticNotes] = useState('')

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
      }

      setResult(mapped)
      toast.success('AI analysis ready')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to analyze')
    } finally {
      setAnalyzing(false)
    }
  }

  const categories = useMemo(() => {
    const cats = new Map<string, DiagnosticTest[]>()
    tests.forEach((t) => {
      if (!cats.has(t.category)) cats.set(t.category, [])
      cats.get(t.category)!.push(t)
    })
    return Array.from(cats.entries())
  }, [tests])

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories)
    if (next.has(cat)) next.delete(cat)
    else next.add(cat)
    setExpandedCategories(next)
  }

  const setTestResult = (id: string, testResult: TestResult) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, result: testResult } : t)))
  }

  const resetTests = () => {
    setTests(defaultTests.map((t) => ({ ...t, result: null })))
    setConditionGrade(null)
    setCosmeticNotes('')
  }

  const passCount = tests.filter((t) => t.result === 'pass').length
  const failCount = tests.filter((t) => t.result === 'fail').length
  const skipCount = tests.filter((t) => t.result === 'skip').length
  const completedCount = passCount + failCount + skipCount
  const totalTests = tests.length
  const progress = (completedCount / totalTests) * 100

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
            checklist: tests,
            conditionGrade,
            cosmeticNotes,
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
          description="Run structured diagnostic tests, grade device condition, and generate reports."
          action={actionButtons}
        />
      </div>

      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'checklist' | 'grading' | 'ai')}
          tabs={[
            { value: 'checklist', label: 'Diagnostic Checklist' },
            { value: 'grading', label: 'Condition Grading' },
            { value: 'ai', label: 'AI Analysis' },
          ]}
          className="mb-4"
        />
      </div>

      {tab === 'checklist' && (
        <div className="space-y-4">
          <GlassCard className="rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Testing Progress</div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-400">✓ {passCount} Pass</span>
                <span className="text-red-400">✗ {failCount} Fail</span>
                <span className="text-white/50">○ {skipCount} Skip</span>
                <span className="text-white/70">{completedCount}/{totalTests}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </GlassCard>

          <div className="space-y-2">
            {categories.map(([category, catTests]) => {
              const Icon = getCategoryIcon(category)
              const isExpanded = expandedCategories.has(category)
              const catPass = catTests.filter((t) => t.result === 'pass').length
              const catFail = catTests.filter((t) => t.result === 'fail').length

              return (
                <GlassCard key={category} className="rounded-2xl overflow-hidden p-0">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{category}</div>
                        <div className="text-xs text-[var(--text-muted)]">{catTests.length} tests</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {catPass > 0 && <span className="text-xs text-emerald-400">{catPass} ✓</span>}
                      {catFail > 0 && <span className="text-xs text-red-400">{catFail} ✗</span>}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 divide-y divide-white/5">
                      {catTests.map((test) => (
                        <div key={test.id} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-[var(--text-primary)]">{test.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">{test.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTestResult(test.id, 'pass')}
                              className={cn(
                                'p-2 rounded-lg transition-all',
                                test.result === 'pass'
                                  ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-white/[0.04] text-white/40 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400'
                              )}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTestResult(test.id, 'fail')}
                              className={cn(
                                'p-2 rounded-lg transition-all',
                                test.result === 'fail'
                                  ? 'bg-red-500/30 text-red-400 border border-red-500/40'
                                  : 'bg-white/[0.04] text-white/40 border border-white/10 hover:bg-red-500/10 hover:text-red-400'
                              )}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTestResult(test.id, 'skip')}
                              className={cn(
                                'p-2 rounded-lg transition-all',
                                test.result === 'skip'
                                  ? 'bg-white/20 text-white/70 border border-white/30'
                                  : 'bg-white/[0.04] text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
                              )}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>

          <div className="flex justify-end">
            <button onClick={resetTests} className="btn-secondary px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset All Tests
            </button>
          </div>
        </div>
      )}

      {tab === 'grading' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Overall Condition Grade</div>
            <div className="grid grid-cols-5 gap-2">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
                const info = gradeDescriptions[grade]
                const colorMap: Record<string, { bg: string; border: string }> = {
                  emerald: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)' },
                  green: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)' },
                  amber: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)' },
                  orange: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)' },
                  red: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)' },
                }
                const colors = colorMap[info.color]
                return (
                  <button
                    key={grade}
                    onClick={() => setConditionGrade(grade)}
                    className={cn(
                      'rounded-2xl p-4 text-center transition-all border',
                      conditionGrade === grade ? '' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                    )}
                    style={conditionGrade === grade ? { backgroundColor: colors.bg, borderColor: colors.border } : undefined}
                  >
                    <div className={cn('text-2xl font-bold mb-1', conditionGrade === grade ? 'text-white' : 'text-white/60')}>
                      {grade}
                    </div>
                    <div className="text-xs text-white/60">{info.label}</div>
                  </button>
                )
              })}
            </div>
            {conditionGrade && (
              <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-sm text-[var(--text-secondary)]">{gradeDescriptions[conditionGrade].description}</div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Cosmetic Inspection</div>
            <div className="space-y-4">
              {[
                { area: 'Screen', options: ['Perfect', 'Minor scratches', 'Cracked', 'Shattered'] },
                { area: 'Frame / Body', options: ['Perfect', 'Minor wear', 'Dents/Bends', 'Significant damage'] },
                { area: 'Back Glass', options: ['Perfect', 'Minor scratches', 'Cracked', 'Shattered'] },
                { area: 'Buttons', options: ['Working', 'Sticky', 'Missing', 'Non-functional'] },
              ].map((item) => (
                <div key={item.area} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">{item.area}</div>
                  <div className="flex flex-wrap gap-2">
                    {item.options.map((opt, i) => (
                      <button
                        key={opt}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          i === 0
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08]'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">Additional Notes</div>
              <textarea
                value={cosmeticNotes}
                onChange={(e) => setCosmeticNotes(e.target.value)}
                className="w-full rounded-2xl bg-[var(--bg-input)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-primary)]/85 placeholder:text-[var(--text-primary)]/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 min-h-[100px]"
                placeholder="Note any additional cosmetic issues..."
              />
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'ai' && (
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
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Powered by Fixology AI</div>
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
      )}
    </div>
  )
}

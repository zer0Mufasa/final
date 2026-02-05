// components/dashboard/ai-diagnostics-panel.tsx
// AI Diagnostics panel for ticket view

'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ReticleIcon, ReticleLoader } from '@/components/shared/reticle-icon'

interface DiagnosticsResult {
  likelyCauses: Array<{ cause: string; confidence: number }>
  overallConfidence: number
  primaryCause: string
  recommendedTests: string[]
  partsSuggestions: string[]
  repairPaths: Array<{
    approach: string
    successRate: number
    parts: string[]
    estimatedTime: string
  }>
  warnings: string[]
  timeEstimate: string
  riskFlags: string[]
}

interface AIDiagnosticsPanelProps {
  ticketId: string
  deviceType: string
  deviceBrand: string
  deviceModel?: string | null
  issueDescription: string
  symptoms?: string[]
}

export function AIDiagnosticsPanel({
  ticketId,
  deviceType,
  deviceBrand,
  deviceModel,
  issueDescription,
  symptoms = [],
}: AIDiagnosticsPanelProps) {
  const [result, setResult] = useState<DiagnosticsResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          deviceType,
          brand: deviceBrand,
          model: deviceModel || undefined,
          symptoms,
          issueDescription,
        }),
      })

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null)
        const message =
          typeof data === 'object' && data && 'error' in data && typeof (data as any).error === 'string'
            ? (data as any).error
            : 'Failed to analyze'
        throw new Error(message)
      }

      const data = await response.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate diagnostics')
    } finally {
      setIsAnalyzing(false)
    }
  }, [deviceBrand, deviceModel, deviceType, issueDescription, symptoms, ticketId])

  // Auto-run on mount if no existing diagnosis
  useEffect(() => {
    if (!result && !isAnalyzing) {
      runDiagnostics()
    }
  }, [isAnalyzing, result, runDiagnostics])

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <ReticleIcon size="sm" color="purple" variant="default" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Diagnosis</h3>
            <p className="text-xs text-white/50">Intelligent repair analysis</p>
          </div>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isAnalyzing}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white disabled:opacity-50"
          aria-label="Re-run diagnostics"
        >
          <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {isAnalyzing && !result && (
        <div className="flex items-center justify-center py-8">
          <ReticleLoader size="lg" color="purple" text="Fixology analyzing..." />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Primary Cause */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ReticleIcon 
                size="sm" 
                color={result.overallConfidence >= 80 ? 'green' : result.overallConfidence >= 60 ? 'amber' : 'red'}
                variant="default"
              />
              <p className="text-sm font-semibold text-white">Most Likely Cause</p>
            </div>
            <p className="text-sm text-white/90 mb-1">{result.primaryCause}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    result.overallConfidence >= 80 ? "bg-green-500" :
                    result.overallConfidence >= 60 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${result.overallConfidence}%` }}
                />
              </div>
              <span className="text-xs text-white/60 font-semibold">{result.overallConfidence}% confidence</span>
            </div>
          </div>

          {/* Likely Causes */}
          {result.likelyCauses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/80 mb-2">Other Possible Causes</p>
              <div className="space-y-1">
                {result.likelyCauses.slice(1).map((cause, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white/[0.05] border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/80">{cause.cause}</span>
                      <span className="text-xs text-white/60">{cause.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Tests */}
          {result.recommendedTests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/80 mb-2">Recommended Diagnostic Tests</p>
              <ul className="space-y-1">
                {result.recommendedTests.map((test, idx) => (
                  <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{test}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parts Suggestions */}
          {result.partsSuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/80 mb-2">Likely Parts Required</p>
              <div className="flex flex-wrap gap-2">
                {result.partsSuggestions.map((part, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-400" />
                Warnings
              </p>
              <div className="space-y-1">
                {result.warnings.map((warning, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair Paths */}
          {result.repairPaths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/80 mb-2">Repair Approaches</p>
              <div className="space-y-2">
                {result.repairPaths.map((path, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.05] border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{path.approach}</span>
                      <span className="text-xs text-green-400 font-semibold">{path.successRate}% success</span>
                    </div>
                    <p className="text-xs text-white/60 mb-2">Est. time: {path.estimatedTime}</p>
                    {path.parts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {path.parts.map((part, pIdx) => (
                          <span key={pIdx} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">
                            {part}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


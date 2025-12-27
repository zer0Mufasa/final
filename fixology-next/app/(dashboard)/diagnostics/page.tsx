// app/(dashboard)/diagnostics/page.tsx
// AI Diagnostics page

'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Cpu, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function DiagnosticsPage() {
  const [deviceType, setDeviceType] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!deviceType || !brand || !issueDescription) {
      setError('Please fill in device type, brand, and issue description')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceType,
          brand,
          model: model || undefined,
          symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : undefined,
          issueDescription,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze')
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze device')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <Header
        title="AI Diagnostics"
        description="Analyze device issues and get repair recommendations"
      />

      <div className="p-6">
        <div className="glass-card max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Device Diagnostics</h2>
              <p className="text-sm text-white/60">Enter device details to get AI-powered analysis</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Device Brand *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Apple, Samsung"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Device Type *</label>
                <input
                  type="text"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  placeholder="e.g., iPhone 14 Pro"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Model (optional)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., A2847"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Issue Description *</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the problem..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Symptoms (comma-separated)</label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., won't turn on, cracked screen, battery drains fast"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !brand || !deviceType || !issueDescription}
              className={cn(
                'w-full px-6 py-4 rounded-xl font-semibold transition-all',
                'bg-gradient-to-r from-purple-500 to-purple-700 text-white',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  Analyze Device
                </>
              )}
            </button>

            {result && (
              <div className="mt-6 p-6 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-2">Overall Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white">{result.confidence}%</span>
                  </div>
                </div>

                {result.likelyCauses && result.likelyCauses.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-2">Likely Causes</p>
                    <div className="space-y-2">
                      {result.likelyCauses.map((cause: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-white/[0.05] border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium">{cause.cause}</span>
                            <span className="text-purple-400 text-sm font-semibold">{cause.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.steps && result.steps.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-2">Diagnostic Steps</p>
                    <ol className="list-decimal list-inside space-y-1 text-white/70">
                      {result.steps.map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.partsSuggestions && result.partsSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-2">Suggested Parts</p>
                    <div className="flex flex-wrap gap-2">
                      {result.partsSuggestions.map((part: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-sm"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.timeEstimate && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-1">Estimated Repair Time</p>
                    <p className="text-white">{result.timeEstimate}</p>
                  </div>
                )}

                {result.riskFlags && result.riskFlags.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-2">Risk Flags</p>
                    <div className="space-y-1">
                      {result.riskFlags.map((flag: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 text-sm">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


// components/dashboard/quick-ai-intake.tsx
// Quick AI Intake widget for dashboard

'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ReticleIcon, ReticleLoader } from '@/components/shared/reticle-icon'

interface AIDraft {
  customer: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
  }
  device: {
    brand: string
    model?: string
    type: string
    color?: string
  }
  issue: string
  noteType?: 'CUSTOMER' | 'TECHNICIAN'
  technicianName?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  suggestedParts: string[]
  estimatedPriceRange?: {
    min: number
    max: number
  }
  questionsToAsk: string[]
  confidence?: {
    customer: number
    device: number
    issue: number
    overall: number
  }
  riskFlags?: string[]
  carrier?: string
  passcode?: string
}

export function QuickAIIntake() {
  const [input, setInput] = useState('')
  const [draft, setDraft] = useState<AIDraft | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [customerMatch, setCustomerMatch] = useState<{ found: boolean; name?: string } | null>(null)

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please describe the repair')
      return
    }

    setIsGenerating(true)
    setError(null)
    setDraft(null)

    try {
      const response = await fetch('/api/tickets/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate draft')
      }

      const data = await response.json()
      setDraft(data.draft)
      
      // Check if customer might already exist (for display purposes)
      if (data.draft.customer.phone || data.draft.customer.email) {
        try {
          const checkResponse = await fetch(`/api/customers/check?phone=${encodeURIComponent(data.draft.customer.phone || '')}&email=${encodeURIComponent(data.draft.customer.email || '')}`)
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            setCustomerMatch(checkData)
          }
        } catch {
          // Ignore check errors
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!draft) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create ticket')
      }

      setSuccess(true)
      setInput('')
      setDraft(null)
      
      // Refresh page after 1 second
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setIsCreating(false)
    }
  }

  const handleReset = () => {
    setDraft(null)
    setInput('')
    setError(null)
    setSuccess(false)
  }

  return (
    <div className="mb-6 p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 flex items-center justify-center border border-purple-500/30">
              <ReticleIcon size="md" color="purple" variant="default" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Quick AI Intake</h3>
              <p className="text-sm text-white/60">Describe a repair in one sentence</p>
            </div>
          </div>

      {!draft && !success && (
        <div className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., john smith 3142871845 14pm lcd damage said dropped car drove over it but still turns on

Or: Customer brought in iPhone 13 with cracked screen. I tested the display and found it's fully functional, just needs screen replacement.

AI will auto-detect: names, phone numbers, device models, and whether it's a customer or technician note."
            className="w-full h-32 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 resize-none text-sm"
            disabled={isGenerating}
          />
          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {isGenerating ? (
            <div className="w-full py-6 flex flex-col items-center justify-center">
              <ReticleLoader 
                size="lg" 
                color="purple" 
                text="Fixology analyzing..."
              />
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!input.trim()}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-semibold transition-all',
                'bg-gradient-to-r from-purple-500 to-purple-700 text-white',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Generate Ticket Draft
            </button>
          )}
        </div>
      )}

      {draft && !success && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Draft Preview</h4>
              <button
                onClick={handleReset}
                className="p-1 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/50 text-xs">Customer</p>
                  {customerMatch?.found && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/20 text-green-400">
                      Existing
                    </span>
                  )}
                </div>
                <p className="text-white font-medium">
                  {draft.customer.firstName || ''} {draft.customer.lastName || ''}
                  {!draft.customer.firstName && !draft.customer.lastName && 'Unknown Customer'}
                </p>
                {draft.customer.phone && (
                  <p className="text-white/60 text-xs mt-1">
                    📞 {draft.customer.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                  </p>
                )}
                {draft.customer.email && (
                  <p className="text-white/60 text-xs mt-1">✉️ {draft.customer.email}</p>
                )}
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Device</p>
                <p className="text-white font-medium">
                  {draft.device.brand} {draft.device.type}
                </p>
                {draft.device.model && (
                  <p className="text-white/60 text-xs mt-1">Model: {draft.device.model}</p>
                )}
                {draft.device.color && (
                  <p className="text-white/60 text-xs mt-1">Color: {draft.device.color}</p>
                )}
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Issue</p>
                <p className="text-white text-xs leading-relaxed">{draft.issue}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Note Type</p>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-semibold',
                      draft.noteType === 'TECHNICIAN' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    )}
                  >
                    {draft.noteType || 'CUSTOMER'}
                  </span>
                  {draft.noteType === 'TECHNICIAN' && draft.technicianName && (
                    <span className="text-white/60 text-xs">by {draft.technicianName}</span>
                  )}
                </div>
                <p className="text-white/50 text-xs mb-1 mt-2">Priority</p>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-semibold',
                    draft.priority === 'URGENT' && 'bg-red-500/20 text-red-400',
                    draft.priority === 'HIGH' && 'bg-orange-500/20 text-orange-400',
                    draft.priority === 'NORMAL' && 'bg-blue-500/20 text-blue-400',
                    draft.priority === 'LOW' && 'bg-gray-500/20 text-gray-400'
                  )}
                >
                  {draft.priority}
                </span>
              </div>
            </div>

            {draft.estimatedPriceRange && (
              <div>
                <p className="text-white/50 text-xs mb-1">Estimated Cost</p>
                <p className="text-green-400 font-semibold">
                  ${draft.estimatedPriceRange.min} - ${draft.estimatedPriceRange.max}
                </p>
              </div>
            )}

            {draft.confidence && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/50 text-xs mb-2">Confidence Score</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Overall</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            draft.confidence.overall >= 80 ? "bg-green-500" :
                            draft.confidence.overall >= 60 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${draft.confidence.overall}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold w-8 text-right">{draft.confidence.overall}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {draft.riskFlags && draft.riskFlags.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/50 text-xs mb-2">⚠️ Risk Flags</p>
                <div className="space-y-1">
                  {draft.riskFlags.map((flag, idx) => (
                    <div key={idx} className="px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {draft.carrier && (
              <div className="pt-2">
                <p className="text-white/50 text-xs mb-1">Carrier</p>
                <p className="text-white text-sm">{draft.carrier}</p>
              </div>
            )}

            {draft.suggestedParts.length > 0 && (
              <div>
                <p className="text-white/50 text-xs mb-2">Suggested Parts</p>
                <div className="flex flex-wrap gap-2">
                  {draft.suggestedParts.map((part, idx) => (
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

            {draft.questionsToAsk.length > 0 && (
              <div>
                <p className="text-white/50 text-xs mb-2">Questions to Ask</p>
                <ul className="list-disc list-inside text-white/70 text-xs space-y-1">
                  {draft.questionsToAsk.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isCreating}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.10] transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={isCreating}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl font-semibold transition-all',
                'bg-gradient-to-r from-green-500 to-green-700 text-white',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <ReticleLoader size="sm" color="purple" />
                  <span>Creating...</span>
                </div>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-semibold">Ticket created successfully!</p>
            <p className="text-white/60 text-sm">Refreshing dashboard...</p>
          </div>
        </div>
      )}
    </div>
  )
}


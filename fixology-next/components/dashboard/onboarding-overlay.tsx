'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const steps = [
  { title: 'Add your shop info', desc: 'Name, address, hours — so tickets and receipts look right.' },
  { title: 'Add staff', desc: 'Front desk + techs with PINs so work is attributed.' },
  { title: 'Create first ticket', desc: 'Log a real device to see the board come alive.' },
  { title: 'Review dashboard', desc: 'Glance at workload, promises, and risks.' },
]

const DISMISS_KEY = 'fx_onboarding_dismissed_at'
const COMPLETE_KEY = 'fx_onboarding_completed'
const TWO_DAYS_MS = 1000 * 60 * 60 * 24 * 2

export function OnboardingOverlay() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)

  // Respect skip/complete persistence
  useEffect(() => {
    try {
      const completed = typeof window !== 'undefined' ? localStorage.getItem(COMPLETE_KEY) : null
      if (completed === '1') return
      const dismissedAt = typeof window !== 'undefined' ? localStorage.getItem(DISMISS_KEY) : null
      if (dismissedAt) {
        const ts = Number(dismissedAt)
        if (!Number.isNaN(ts) && Date.now() - ts < TWO_DAYS_MS) return
      }
      setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  // Close on Escape (UI only)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  const percent = Math.round(((current + 1) / steps.length) * 100)

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0c0b12]/95 border border-white/10 shadow-2xl shadow-purple-500/20 p-6 space-y-6">
        <button
          aria-label="Dismiss onboarding"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-200 font-semibold">
            {current + 1}
          </div>
          <div>
            <p className="text-sm text-white/60">Welcome to Fixology</p>
            <h2 className="text-xl font-semibold text-white">Let’s set you up — calm and quick</h2>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isActive = idx === current
            const isDone = idx < current
            return (
              <button
                key={step.title}
                onClick={() => setCurrent(idx)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all',
                  isActive
                    ? 'border-purple-400/40 bg-purple-500/5 shadow-[0_10px_30px_rgba(168,85,247,0.12)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold',
                        isDone
                          ? 'border-emerald-300/60 text-emerald-200 bg-emerald-500/10'
                          : isActive
                            ? 'border-purple-300/60 text-purple-200 bg-purple-500/10'
                            : 'border-white/15 text-white/60'
                      )}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{step.title}</p>
                      <p className="text-white/60 text-sm">{step.desc}</p>
                    </div>
                  </div>
                  {isDone && <span className="text-emerald-200 text-xs font-semibold">Done</span>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setOpen(false)
              try {
                localStorage.setItem(DISMISS_KEY, String(Date.now()))
              } catch {}
            }}
            className="text-sm text-white/60 hover:text-white transition underline underline-offset-4"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:border-white/30 transition"
            >
              Back
            </button>
            <button
              onClick={() =>
                current === steps.length - 1
                  ? (() => {
                      setOpen(false)
                      try {
                        localStorage.setItem(COMPLETE_KEY, '1')
                      } catch {}
                    })()
                  : setCurrent((c) => Math.min(steps.length - 1, c + 1))
              }
              className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30"
            >
              {current === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


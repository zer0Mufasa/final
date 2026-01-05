'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Map, Plus, CheckCircle, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminOnboardingClient() {
  const { data: stepsData, mutate } = useSWR('/api/admin/onboarding/steps', fetcher)
  const steps = stepsData?.steps || []
  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Onboarding Flows"
        description="Define onboarding steps and track completion rates."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">—</p>
              <p className="text-sm text-white/60">Completion Rate</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">—</p>
              <p className="text-sm text-white/60">Avg. Time</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Map className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">0</p>
              <p className="text-sm text-white/60">Steps Defined</p>
            </div>
          </div>
        </GlassCard>
      </div>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white/90">Onboarding Steps</h2>
            <button
              onClick={async () => {
                const title = prompt('Enter step title:')
                if (!title) return
                const description = prompt('Enter step description (optional):') || undefined
                try {
                  const res = await fetch('/api/admin/onboarding/steps', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description }),
                  })
                  if (!res.ok) throw new Error('Failed to create step')
                  toast.success('Step created successfully')
                  mutate()
                } catch (err: any) {
                  toast.error(err.message || 'Failed to create step')
                }
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>
          {steps.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No onboarding steps defined. Create your first step.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step: any, index: number) => (
                <div
                  key={step.id}
                  className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex items-center gap-3"
                >
                  <span className="text-sm font-semibold text-white/60 w-6">{index + 1}.</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white/90">{step.title}</p>
                    {step.description && (
                      <p className="text-xs text-white/60 mt-1">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
    </div>
  )
}

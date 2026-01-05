'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Beaker, Plus, Play, BarChart3, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminExperimentsClient() {
  const { data: experimentsData, mutate } = useSWR('/api/admin/experiments', fetcher)
  const experiments = experimentsData?.experiments || []
  const activeExperiments = experiments.filter((e: any) => e.status === 'running')
  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="A/B Tests & Experiments"
        description="Run experiments, track results, and roll out winners."
        action={
          <button className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Experiment
          </button>
        }
      />

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Active Experiments</h2>
        {activeExperiments.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Beaker className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No active experiments. Create your first A/B test.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeExperiments.map((exp: any) => (
              <div key={exp.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white/90">{exp.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Running
                  </span>
                </div>
                {exp.hypothesis && (
                  <p className="text-sm text-white/60 mb-2">{exp.hypothesis}</p>
                )}
                <p className="text-xs text-white/50">Metric: {exp.metric}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Experiment History</h2>
        {experiments.filter((e: any) => e.status !== 'running').length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No past experiments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {experiments
              .filter((e: any) => e.status !== 'running')
              .map((exp: any) => (
                <div key={exp.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white/90">{exp.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30 capitalize">
                      {exp.status}
                    </span>
                  </div>
                  {exp.winner && (
                    <p className="text-sm text-white/60">Winner: {exp.winner}</p>
                  )}
                </div>
              ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

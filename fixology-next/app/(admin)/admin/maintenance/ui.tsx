'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Wrench, Power, PowerOff, Calendar, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminMaintenanceClient() {
  const [confirmText, setConfirmText] = useState('')
  const [isToggling, setIsToggling] = useState(false)

  const { data, mutate } = useSWR('/api/admin/maintenance', fetcher)
  const maintenanceMode = data?.isActive || false

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Maintenance Mode"
        description="Schedule maintenance windows and enable maintenance mode."
      />

      <GlassCard className={maintenanceMode ? 'border-amber-500/30 bg-amber-500/5' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-white/90">Current Status</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  maintenanceMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {maintenanceMode ? 'MAINTENANCE MODE ACTIVE' : 'Operational'}
              </span>
            </div>
            <p className="text-sm text-white/60 mb-4">
              {maintenanceMode
                ? 'Maintenance mode is currently active. Users will see the maintenance page.'
                : 'All systems are operational. No maintenance scheduled.'}
            </p>
            {!maintenanceMode && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type 'ENABLE MAINTENANCE' to confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20"
                />
                <button
                  onClick={async () => {
                    if (confirmText !== 'ENABLE MAINTENANCE') {
                      toast.error('Please type exactly: ENABLE MAINTENANCE')
                      return
                    }
                    setIsToggling(true)
                    try {
                      const res = await fetch('/api/admin/maintenance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'enable' }),
                      })
                      if (!res.ok) throw new Error('Failed to enable maintenance mode')
                      toast.success('Maintenance mode enabled')
                      setConfirmText('')
                      mutate()
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to enable maintenance mode')
                    } finally {
                      setIsToggling(false)
                    }
                  }}
                  disabled={confirmText !== 'ENABLE MAINTENANCE' || isToggling}
                  className="btn-secondary bg-amber-500/20 border-amber-500/30 text-amber-300 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  Enable Maintenance Mode
                </button>
              </div>
            )}
            {maintenanceMode && (
              <button
                onClick={async () => {
                  setIsToggling(true)
                  try {
                    const res = await fetch('/api/admin/maintenance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'disable' }),
                    })
                    if (!res.ok) throw new Error('Failed to disable maintenance mode')
                    toast.success('Maintenance mode disabled')
                    mutate()
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to disable maintenance mode')
                  } finally {
                    setIsToggling(false)
                  }
                }}
                disabled={isToggling}
                className="btn-primary inline-flex items-center gap-2"
              >
                {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                Disable Maintenance Mode
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white/90">Schedule Maintenance Window</h2>
          <button className="btn-secondary inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
        </div>
        <div className="text-center py-12 text-white/50">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Schedule future maintenance windows with automatic enable/disable.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Maintenance History</h2>
        <div className="text-center py-12 text-white/50">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>View past maintenance windows and their duration.</p>
        </div>
      </GlassCard>
    </div>
  )
}

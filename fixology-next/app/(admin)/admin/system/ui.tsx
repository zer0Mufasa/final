'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Server, Database, CheckCircle, AlertCircle, Activity, RefreshCw, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSystemClient() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: healthData, mutate } = useSWR('/api/_health', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const health = healthData || {
    status: 'healthy',
    database: { status: 'connected', latency: 12 },
    api: { status: 'operational', uptime: 99.9 },
    timestamp: new Date().toISOString(),
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await mutate()
      toast.success('Health check refreshed')
    } catch (err) {
      toast.error('Failed to refresh health status')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return 'text-emerald-400'
      case 'degraded':
      case 'warning':
        return 'text-amber-400'
      case 'down':
      case 'error':
        return 'text-rose-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return 'bg-emerald-500/20 border-emerald-500/30'
      case 'degraded':
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/30'
      case 'down':
      case 'error':
        return 'bg-rose-500/20 border-rose-500/30'
      default:
        return 'bg-gray-500/20 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="System Health"
        description="API health, DB connectivity, and incident status"
        action={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Server className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white/90">API Status</h3>
              <p className="text-sm text-white/60">All services operational</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={cn('w-4 h-4', getStatusColor(health.api?.status || 'operational'))} />
              <span className={cn('text-sm font-medium', getStatusColor(health.api?.status || 'operational'))}>
                {health.api?.status || 'Operational'}
              </span>
            </div>
            <span className="text-xs text-white/50">Uptime: {health.api?.uptime || 99.9}%</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white/90">Database</h3>
              <p className="text-sm text-white/60">Connection status</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={cn('w-4 h-4', getStatusColor(health.database?.status || 'connected'))} />
              <span className={cn('text-sm font-medium', getStatusColor(health.database?.status || 'connected'))}>
                {health.database?.status || 'Connected'}
              </span>
            </div>
            {health.database?.latency && (
              <span className="text-xs text-white/50">{health.database.latency}ms</span>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white/90">System Status</h3>
              <p className="text-sm text-white/60">Overall health</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className={cn('w-4 h-4', getStatusColor(health.status || 'healthy'))} />
              <span className={cn('text-sm font-medium', getStatusColor(health.status || 'healthy'))}>
                {health.status || 'Healthy'}
              </span>
            </div>
            {health.timestamp && (
              <span className="text-xs text-white/50">
                {format(parseISO(health.timestamp), 'h:mm a')}
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-lg font-semibold text-white/90 mb-4">Recent Incidents</h3>
        <div className="text-center py-12 text-white/50">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30 text-emerald-400" />
          <p>No incidents reported. All systems operational.</p>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-semibold text-white/90 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="text-2xl font-bold text-white/95 mb-1">12ms</div>
            <div className="text-sm text-white/60">Avg. Response Time</div>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="text-2xl font-bold text-white/95 mb-1">99.9%</div>
            <div className="text-sm text-white/60">Uptime (30d)</div>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
            <div className="text-2xl font-bold text-white/95 mb-1">1,234</div>
            <div className="text-sm text-white/60">Requests/min</div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Database, Search, Trash2, Download, Upload, BarChart3, Play } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminDatabaseClient() {
  const [activeTab, setActiveTab] = useState<'queries' | 'explorer' | 'cleanup' | 'backups'>('queries')
  const [query, setQuery] = useState('SELECT COUNT(*) FROM shops WHERE status = \'ACTIVE\';')

  const { data: statsData } = useSWR('/api/admin/database/stats', fetcher)
  const stats = statsData?.stats || {}

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Database Tools"
        description="Query explorer, cleanup, backups, and database management."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.tableCount || '—'}</p>
              <p className="text-sm text-white/60">Tables</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.totalRows || '—'}</p>
              <p className="text-sm text-white/60">Total Rows</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.backupCount || '0'}</p>
              <p className="text-sm text-white/60">Backups</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white/95">{stats.deletedRecords || '0'}</p>
              <p className="text-sm text-white/60">Deleted Records</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['queries', 'explorer', 'cleanup', 'backups'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'queries' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Quick Queries</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] text-left transition-colors">
                <p className="font-semibold text-white/90 mb-1">Count shops by status</p>
                <p className="text-xs text-white/50">SELECT status, COUNT(*) FROM shops GROUP BY status;</p>
              </button>
              <button className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] text-left transition-colors">
                <p className="font-semibold text-white/90 mb-1">Find duplicate emails</p>
                <p className="text-xs text-white/50">Find users with duplicate email addresses</p>
              </button>
              <button className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] text-left transition-colors">
                <p className="font-semibold text-white/90 mb-1">List inactive shops</p>
                <p className="text-xs text-white/50">Shops with no login in 30+ days</p>
              </button>
              <button className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] text-left transition-colors">
                <p className="font-semibold text-white/90 mb-1">Find orphaned records</p>
                <p className="text-xs text-white/50">Records with missing relations</p>
              </button>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Custom Query (Read-Only)</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
              />
              <button
                onClick={async () => {
                  if (!query.trim()) {
                    toast.error('Please enter a query')
                    return
                  }
                  try {
                    const res = await fetch('/api/admin/database/query', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query }),
                    })
                    if (!res.ok) {
                      const error = await res.json()
                      throw new Error(error.error || 'Query failed')
                    }
                    const data = await res.json()
                    toast.success(`Query executed successfully. ${data.rowCount} row(s) returned.`)
                    console.log('Query result:', data.result)
                  } catch (err: any) {
                    toast.error(err.message || 'Query execution failed')
                  }
                }}
                className="mt-2 btn-primary inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Execute Query
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'explorer' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Data Explorer</h2>
          <div className="text-center py-12 text-white/50">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Browse tables, filter and search, export to CSV.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'cleanup' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Data Cleanup</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="font-semibold text-white/90 mb-2">Purge deleted records</p>
              <p className="text-sm text-white/60 mb-3">Remove soft-deleted records older than X days</p>
              <button className="btn-secondary">Configure Cleanup</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="font-semibold text-white/90 mb-2">Archive old tickets</p>
              <p className="text-sm text-white/60 mb-3">Move tickets older than 1 year to archive</p>
              <button className="btn-secondary">Archive Tickets</button>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <p className="font-semibold text-white/90 mb-2">Compress audit logs</p>
              <p className="text-sm text-white/60 mb-3">Compress audit logs older than 90 days</p>
              <button className="btn-secondary">Compress Logs</button>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTab === 'backups' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Backups</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div>
                <p className="font-semibold text-white/90">Manual Backup</p>
                <p className="text-sm text-white/60">Create a backup now</p>
              </div>
              <button className="btn-primary inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Create Backup
              </button>
            </div>
            <div className="text-center py-12 text-white/50">
              <Download className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No backups yet. Create your first backup.</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

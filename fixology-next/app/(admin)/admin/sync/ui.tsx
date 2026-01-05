'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Download, Upload, FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/admin/ui/button'
import { EmptyState } from '@/components/admin/ui/empty-state'
import { Modal } from '@/components/admin/ui/modal'
import { cn } from '@/lib/utils/cn'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminSyncClient() {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importType, setImportType] = useState<'shops' | 'users' | 'tickets'>('shops')
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const { data: importHistoryData } = useSWR('/api/admin/sync/import/history', fetcher)
  const { data: exportHistoryData } = useSWR('/api/admin/sync/export/history', fetcher)

  const importHistory = importHistoryData?.jobs || []
  const exportHistory = exportHistoryData?.jobs || []

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file')
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('type', importType)

      const res = await fetch('/api/admin/sync/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to import')
      }

      toast.success('Import started. Check history for progress.')
      setShowImportModal(false)
      setImportFile(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to import')
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async (type: string, format: string = 'csv') => {
    try {
      const res = await fetch(`/api/admin/sync/export/${type}?format=${format}`, {
        method: 'GET',
      })

      if (!res.ok) throw new Error('Failed to export')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${new Date().toISOString()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Export started')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-400" />
      case 'processing':
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-white/40" />
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Sync & Import"
        description="Import and export data via CSV, manage bulk operations."
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['import', 'export', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 font-medium transition-colors capitalize',
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'import' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Import Data</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Import Type</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-purple-500/30"
              >
                <option value="shops">Shops</option>
                <option value="users">Users</option>
                <option value="tickets">Tickets</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
              />
            </div>
            <Button
              onClick={handleImport}
              isLoading={isImporting}
              disabled={!importFile}
              leftIcon={<Upload className="w-4 h-4" />}
              className="w-full"
            >
              Start Import
            </Button>
            <p className="text-xs text-white/50">
              CSV files should include headers. Field mapping will be available after upload.
            </p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'export' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { type: 'shops', label: 'Export Shops', icon: Download },
            { type: 'users', label: 'Export Users', icon: Download },
            { type: 'transactions', label: 'Export Transactions', icon: Download },
          ].map(({ type, label, icon: Icon }) => (
            <GlassCard key={type}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white/90">{label}</h3>
                  <p className="text-sm text-white/60">CSV format</p>
                </div>
              </div>
              <Button
                onClick={() => handleExport(type, 'csv')}
                variant="secondary"
                className="w-full"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export CSV
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="text-lg font-semibold text-white/90 mb-4">Import History</h3>
            {importHistory.length === 0 ? (
              <EmptyState
                icon={<Upload className="w-12 h-12 mx-auto opacity-30" />}
                title="No import history"
                description="Import jobs will appear here"
              />
            ) : (
              <div className="space-y-2">
                {importHistory.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="text-sm text-white/85">{job.type} import</p>
                        <p className="text-xs text-white/50">
                          {format(parseISO(job.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      job.status === 'failed' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-blue-500/20 text-blue-300'
                    )}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="text-lg font-semibold text-white/90 mb-4">Export History</h3>
            {exportHistory.length === 0 ? (
              <EmptyState
                icon={<Download className="w-12 h-12 mx-auto opacity-30" />}
                title="No export history"
                description="Export jobs will appear here"
              />
            ) : (
              <div className="space-y-2">
                {exportHistory.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="text-sm text-white/85">{job.type} export ({job.format})</p>
                        <p className="text-xs text-white/50">
                          {format(parseISO(job.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        job.status === 'failed' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-blue-500/20 text-blue-300'
                      )}>
                        {job.status}
                      </span>
                      {job.status === 'completed' && job.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(job.fileUrl, '_blank')}
                          tooltip="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

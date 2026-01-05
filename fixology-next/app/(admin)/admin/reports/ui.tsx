'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { FileText, Plus, Calendar, Download, BarChart3 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminReportsClient() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'builder' | 'history'>('scheduled')

  const { data: scheduledData } = useSWR('/api/admin/reports/scheduled', fetcher)
  const scheduled = scheduledData?.reports || []

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Reports Center"
        description="Scheduled reports, custom report builder, and report history."
        action={
          <button className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Report
          </button>
        }
      />

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['scheduled', 'builder', 'history'] as const).map((tab) => (
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

      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {scheduled.length === 0 ? (
            <GlassCard>
              <div className="text-center py-12 text-white/50">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No scheduled reports. Create recurring reports for automated insights.</p>
              </div>
            </GlassCard>
          ) : (
            scheduled.map((report: any) => (
              <GlassCard key={report.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white/90">{report.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {report.schedule}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          report.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}
                      >
                        {report.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-2">Type: {report.type}</p>
                    <p className="text-xs text-white/50">
                      Recipients: {report.recipients?.join(', ') || 'None'} • Format: {report.format?.join(', ')}
                    </p>
                    {report.nextRunAt && (
                      <p className="text-xs text-white/50 mt-1">
                        Next run: {format(parseISO(report.nextRunAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white/80 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'builder' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Custom Report Builder</h2>
          <div className="text-center py-12 text-white/50">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Build custom reports with drag-and-drop metrics and dimensions.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'history' && (
        <GlassCard>
          <h2 className="text-xl font-semibold text-white/90 mb-4">Report History</h2>
          <div className="text-center py-12 text-white/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>View generated reports and download past reports.</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

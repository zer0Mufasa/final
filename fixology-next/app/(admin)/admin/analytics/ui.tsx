'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { BarChart3, TrendingUp, Users, Activity, Download, Filter, Calendar } from 'lucide-react'
import { StatCard } from '@/components/admin/ui/stat-card'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminAnalyticsClient() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'engagement'>('overview')

  const { data: statsData } = useSWR('/api/admin/stats', fetcher)
  const stats = statsData || {}

  // Mock cohort data - replace with real API
  const cohortData = [
    { month: 'Jan', users: 120, retention: 85 },
    { month: 'Feb', users: 145, retention: 82 },
    { month: 'Mar', users: 168, retention: 88 },
    { month: 'Apr', users: 192, retention: 90 },
    { month: 'May', users: 215, retention: 87 },
  ]

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Analytics"
        description="Deep platform analytics and cohort insights"
        action={
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="btn-secondary inline-flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          tone="purple"
          label="Active Users"
          value={stats.users?.total || '0'}
          subValue={`${stats.users?.activeToday || 0} today`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          tone="blue"
          label="Growth Rate"
          value={stats.shops?.newThisMonth ? `+${stats.shops.newThisMonth}` : '—'}
          subValue="This month"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          tone="emerald"
          label="Cohorts"
          value="5"
          subValue="Active cohorts"
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <StatCard
          tone="amber"
          label="Engagement"
          value="87%"
          subValue="Avg. retention"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {(['overview', 'cohorts', 'engagement'] as const).map((tab) => (
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

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white/90">User Growth</h3>
              <p className="text-sm text-white/45">New users over time</p>
            </div>
            <div className="p-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cohortData}>
                  <defs>
                    <linearGradient id="userFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(167, 139, 250, 0.55)" />
                      <stop offset="100%" stopColor="rgba(167, 139, 250, 0.05)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,14,0.92)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#a78bfa" fill="url(#userFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white/90">Retention Rate</h3>
              <p className="text-sm text-white/45">Cohort retention over time</p>
            </div>
            <div className="p-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cohortData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,14,0.92)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="retention" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'cohorts' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Cohort Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="py-3 px-4 font-medium text-white/80">Cohort</th>
                  <th className="py-3 px-4 font-medium text-white/80">Users</th>
                  <th className="py-3 px-4 font-medium text-white/80">Retention</th>
                  <th className="py-3 px-4 font-medium text-white/80">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort, idx) => (
                  <tr key={idx} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white/85">{cohort.month} 2024</td>
                    <td className="py-3 px-4">{cohort.users}</td>
                    <td className="py-3 px-4">{cohort.retention}%</td>
                    <td className="py-3 px-4">$—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === 'engagement' && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white/90 mb-4">Engagement Metrics</h3>
          <div className="text-center py-12 text-white/50">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Engagement analytics coming soon.</p>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/cards'
import { Plug, CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { format, parseISO } from 'date-fns'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AdminIntegrationsClient() {
  const { data: integrationsData, mutate } = useSWR('/api/admin/integrations', fetcher)
  const integrations = integrationsData?.integrations || []

  const services = [
    { id: 'stripe', name: 'Stripe', description: 'Payment processing', icon: '💳' },
    { id: 'twilio', name: 'Twilio', description: 'SMS messaging', icon: '📱' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery', icon: '📧' },
    { id: 'google', name: 'Google OAuth', description: 'Authentication', icon: '🔐' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-amber-400" />
      case 'down':
        return <XCircle className="w-5 h-5 text-rose-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'degraded':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'down':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-in">
      <PageHeader
        title="Integrations Hub"
        description="Manage connected services, API keys, and integration health."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => {
          const integration = integrations.find((i: any) => i.service === service.id)
          const status = integration?.status || 'unknown'
          const isActive = integration?.isActive || false

          return (
            <GlassCard key={service.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white/90">{service.name}</h3>
                    <p className="text-xs text-white/60">{service.description}</p>
                  </div>
                </div>
                {getStatusIcon(status)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Status</span>
                  <span className={cn('text-xs px-2 py-1 rounded-full', getStatusColor(status))}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">Connection</span>
                  <span className={cn('text-xs px-2 py-1 rounded-full', isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300')}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {integration?.lastCheckAt && (
                  <p className="text-xs text-white/50">
                    Last check: {format(parseISO(integration.lastCheckAt), 'MMM d, h:mm a')}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 btn-secondary text-xs py-1.5 inline-flex items-center justify-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Test
                  </button>
                  <button className="flex-1 btn-secondary text-xs py-1.5 inline-flex items-center justify-center gap-1">
                    Configure
                  </button>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">API Keys Management</h2>
        <div className="space-y-3">
          {services.map((service) => {
            const integration = integrations.find((i: any) => i.service === service.id)
            const config = integration?.config || {}
            const hasKey = config.apiKey || config.secretKey

            return (
              <div
                key={service.id}
                className="p-4 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white/90">{service.name} API Key</p>
                  <p className="text-sm text-white/60 font-mono">
                    {hasKey ? '••••••••' + (typeof hasKey === 'string' ? hasKey.slice(-4) : '') : 'Not configured'}
                  </p>
                </div>
                <button className="btn-secondary text-sm">Update</button>
              </div>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-semibold text-white/90 mb-4">External Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://dashboard.stripe.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-white/90">Stripe Dashboard</p>
              <p className="text-xs text-white/60">Payment processing</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </a>
          <a
            href="https://console.twilio.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-white/90">Twilio Console</p>
              <p className="text-xs text-white/60">SMS & voice</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </a>
          <a
            href="https://app.sendgrid.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-white/90">SendGrid Dashboard</p>
              <p className="text-xs text-white/60">Email delivery</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </a>
        </div>
      </GlassCard>
    </div>
  )
}

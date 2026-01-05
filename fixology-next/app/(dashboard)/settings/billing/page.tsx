'use client'

import { useEffect, useState } from 'react'
import { CreditCard, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function BillingSettingsPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      const data = await res.json()
      setSubscription(data)
    } catch (error) {
      console.error('Failed to fetch subscription')
    } finally {
      setLoading(false)
    }
  }

  const openBillingPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Billing & Subscription" description="Manage your subscription and payment methods" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/60" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Billing & Subscription" description="Manage your subscription and payment methods" />

      <div className="space-y-6">
        {/* Current Plan */}
        <GlassCard className="p-6 rounded-3xl">
          <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-white">
                {subscription?.planDetails?.name || subscription?.plan || 'No Plan'}
              </p>
              <p className="text-white/60">
                ${subscription?.planDetails?.price || 0}/month
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                subscription?.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : subscription?.status === 'TRIAL'
                  ? 'bg-blue-500/20 text-blue-400'
                  : subscription?.status === 'PAST_DUE'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {subscription?.status || 'No Subscription'}
            </span>
          </div>

          {subscription?.trialEnd && subscription?.status === 'TRIAL' && (
            <div className="flex items-center gap-2 text-amber-400 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Trial ends {new Date(subscription.trialEnd).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription?.currentPeriodEnd && subscription?.status === 'ACTIVE' && (
            <p className="text-sm text-white/40">
              Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </GlassCard>

        {/* Manage Billing Button */}
        {subscription?.hasSubscription && (
          <Button
            onClick={openBillingPortal}
            disabled={portalLoading}
            leftIcon={<CreditCard className="w-4 h-4" />}
            rightIcon={<ExternalLink className="w-4 h-4" />}
          >
            {portalLoading ? 'Opening...' : 'Manage Billing'}
          </Button>
        )}

        {/* Upgrade CTA */}
        {subscription?.plan === 'STARTER' && (
          <GlassCard className="p-6 rounded-3xl border-violet-500/50 bg-violet-500/10">
            <h3 className="text-lg font-semibold text-white mb-2">Upgrade to Professional</h3>
            <p className="text-white/60 mb-4">
              Get AI diagnostics, inventory management, and more.
            </p>
            <Button
              onClick={() => router.push('/pricing')}
              className="bg-violet-500 hover:bg-violet-600"
            >
              View Plans
            </Button>
          </GlassCard>
        )}

        {/* Features List */}
        {subscription?.planDetails?.features && (
          <GlassCard className="p-6 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-4">Plan Features</h3>
            <ul className="space-y-2">
              {subscription.planDetails.features.map((feature: string) => (
                <li key={feature} className="flex items-center gap-2 text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

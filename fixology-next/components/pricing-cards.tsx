'use client'

import { useState } from 'react'
import { Check, Zap } from 'lucide-react'
import { PLANS } from '@/lib/stripe/plans'

const PLAN_DISPLAY = {
  STARTER: {
    name: 'Starter',
    description: 'Perfect for small repair shops',
    features: [
      'POS Dashboard',
      'Ticket Management',
      'Customer Database',
      '1 Team Member',
      'Email Support',
      'Basic Reports',
    ],
    cta: 'Start 14-Day Free Trial',
  },
  PROFESSIONAL: {
    name: 'Professional',
    description: 'For growing repair businesses',
    popular: true,
    features: [
      'Everything in Starter',
      'AI Diagnostics (GPT)',
      'Inventory Management',
      'Advanced Reports & Analytics',
      'Autopilot SMS/Email',
      '5 Team Members',
      'Priority Support',
      'Custom Branding',
    ],
    cta: 'Start 30-Day Free Trial',
  },
}

export function PricingCards({ shopId, currentPlan }: { shopId?: string; currentPlan?: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: 'STARTER' | 'PROFESSIONAL') => {
    setLoading(planId)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId === 'STARTER' ? 'starter' : 'professional',
          shopId,
        }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (error) {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-16 grid gap-8 md:grid-cols-2">
      {(['STARTER', 'PROFESSIONAL'] as const).map((planKey) => {
        const plan = PLANS[planKey]
        const display = PLAN_DISPLAY[planKey]
        const isCurrentPlan = currentPlan === planKey || currentPlan === (planKey === 'STARTER' ? 'STARTER' : 'PRO')
        const isProfessional = planKey === 'PROFESSIONAL'

        return (
          <div
            key={planKey}
            className={`relative rounded-2xl border p-8 transition-all ${
              isProfessional
                ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
            }`}
          >
            {display.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500 px-4 py-1 text-sm font-semibold text-white">
                  <Zap className="h-4 w-4" /> MOST POPULAR
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">{display.name}</h3>
              <p className="mt-2 text-white/60">{display.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">${plan.price}</span>
                <span className="ml-2 text-white/60">/month</span>
              </div>
              <p className="mt-2 text-sm font-medium text-emerald-400">
                {plan.trialDays} days free trial
              </p>
            </div>

            <ul className="mb-8 space-y-4">
              {display.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span className="text-white/80">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => !isCurrentPlan && handleSubscribe(planKey)}
              disabled={loading === planKey || isCurrentPlan}
              className={`w-full rounded-xl py-4 font-semibold transition-all ${
                isCurrentPlan
                  ? 'cursor-not-allowed bg-white/10 text-white/50'
                  : isProfessional
                  ? 'bg-violet-500 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/25'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {loading === planKey
                ? 'Loading...'
                : isCurrentPlan
                ? 'Current Plan'
                : display.cta}
            </button>
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, CreditCard, ArrowRight, HelpCircle } from 'lucide-react'

interface BillingRequiredProps {
  reason?: string
}

export function BillingRequired({ reason }: BillingRequiredProps) {
  const router = useRouter()

  const reasonMessages: Record<string, { title: string; description: string }> = {
    trial_expired: {
      title: 'Your trial has expired',
      description: 'Your 14-day free trial has ended. Upgrade to continue using Fixology.',
    },
    subscription_inactive: {
      title: 'Subscription inactive',
      description: 'Your subscription is no longer active. Please update your billing to continue.',
    },
    database_error: {
      title: 'Connection issue',
      description: 'We had trouble connecting to your account. Please try again or contact support.',
    },
  }

  const message = reasonMessages[reason || ''] || {
    title: 'Billing required',
    description: 'Please update your billing information to continue using Fixology.',
  }

  const enterDemo = () => {
    // Set demo cookie and redirect to dashboard
    document.cookie = `fx_demo=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-8 shadow-2xl shadow-purple-500/10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            {message.title}
          </h1>
          <p className="text-white/60 text-center mb-8">
            {message.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/settings/billing')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Update Billing
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={enterDemo}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 font-medium hover:bg-white/[0.08] hover:text-white transition-all"
            >
              Continue in Demo Mode
            </button>
          </div>

          {/* Help link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Need help? Contact support
            </Link>
          </div>

          {/* Back to login */}
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import { BillingRequired } from './billing-required'
import { OnboardingWizard } from './wizard'

type MeResponse =
  | {
      type: 'shop_user'
      user: { id: string; name: string; email: string; role: string; shopId: string }
      shop: { id: string; name: string; plan: string; status: string; features: any }
    }
  | { type: 'platform_admin'; user: any }
  | { error: string }

async function getJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; error: any }> {
  try {
    const res = await fetch(url, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, error: data }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, status: 0, error: e }
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const params = useSearchParams()

  const billing = params.get('billing')
  const reason = params.get('reason') || undefined
  const checkout = params.get('checkout')

  const [loading, setLoading] = useState(true)
  const [initial, setInitial] = useState<any>(null)
  const [hardError, setHardError] = useState<'database_error' | null>(null)

  // Show success message if coming from Stripe checkout
  useEffect(() => {
    if (checkout === 'success') {
      toast.success('Payment successful! Complete your setup below.')
    } else if (checkout === 'cancelled') {
      toast.error('Checkout was cancelled. Please complete payment to continue.')
    }
  }, [checkout])

  // Billing-required pages are fully client-safe.
  if (billing === 'required') {
    return <BillingRequired reason={reason} />
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setHardError(null)

      const meRes = await getJson<MeResponse>('/api/me')
      if (!meRes.ok) {
        router.replace('/login?redirect=/onboarding')
        return
      }

      const me = meRes.data as any
      if (me?.type !== 'shop_user') {
        router.replace('/login?redirect=/onboarding')
        return
      }

      const shopId = me.shop?.id
      if (!shopId) {
        router.replace('/login?error=no_shop')
        return
      }

      const shopRes = await getJson<any>(`/api/shops/${shopId}`)
      if (!shopRes.ok) {
        if (!cancelled) {
          setHardError('database_error')
          setLoading(false)
        }
        return
      }

      const shop = shopRes.data || {}
      if (shop.onboardingCompletedAt) {
        router.replace('/dashboard')
        return
      }

      const features = (shop.features ?? {}) as any
      const initialStepRaw = features?.onboarding_step
      const initialStep = typeof initialStepRaw === 'number' ? initialStepRaw : 1

      const init = {
        step: Math.min(5, Math.max(1, initialStep)),
        ownerName: me.user?.name || 'Owner',
        shop: {
          name: shop.name || '',
          phone: shop.phone || '',
          address: shop.address || '',
          city: shop.city || '',
          state: shop.state || '',
          zip: shop.zip || '',
          timezone: shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          repairFocus: Array.isArray(shop.repairFocus) ? shop.repairFocus : [],
          businessHours: shop.businessHours || {},
          features: features,
        },
      }

      if (!cancelled) {
        setInitial(init)
        setLoading(false)
      }
    }

    run().catch(() => {
      if (!cancelled) {
        setHardError('database_error')
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [router])

  if (hardError) return <BillingRequired reason={hardError} />

  if (loading || !initial) {
    return <BillingRequired reason="database_error" />
  }

  return <OnboardingWizard initial={initial} />
}



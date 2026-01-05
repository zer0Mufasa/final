import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { OnboardingWizard } from './wizard'
import { BillingRequired } from './billing-required'

export const metadata = {
  title: 'Onboarding',
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { billing?: string; reason?: string }
}) {
  // Handle billing required case first to prevent redirect loops
  if (searchParams.billing === 'required') {
    return <BillingRequired reason={searchParams.reason} />
  }

  let session: any = null
  try {
    const supabase = createClient()
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    session = s
  } catch (error) {
    // If Supabase env vars are misconfigured, don't hard-crash onboarding.
    console.error('Supabase session error in onboarding:', error)
    return <BillingRequired reason="database_error" />
  }

  if (!session) {
    redirect('/login?redirect=/onboarding')
  }

  let shopUser
  try {
    shopUser = await prisma.shopUser.findFirst({
      where: {
        email: session.user.email!,
        status: 'ACTIVE',
      },
      include: {
        shop: {
          // Avoid selecting columns that may not exist yet in production (e.g. imei_credits).
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            timezone: true,
            onboardingCompletedAt: true,
            businessHours: true,
            repairFocus: true,
            plan: true,
            status: true,
            trialEndsAt: true,
            features: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          },
        },
      },
    })
  } catch (error) {
    // Database error - show billing required page as fallback
    console.error('Database error in onboarding:', error)
    return <BillingRequired reason="database_error" />
  }

  if (!shopUser) {
    redirect('/login?error=no_shop')
  }

  if (shopUser.shop.onboardingCompletedAt) {
    redirect('/dashboard')
  }

  const features = (shopUser.shop.features ?? {}) as any
  const initialStepRaw = features?.onboarding_step
  const initialStep = typeof initialStepRaw === 'number' ? initialStepRaw : 1

  return (
    <OnboardingWizard
      initial={{
        step: Math.min(5, Math.max(1, initialStep)),
        ownerName: shopUser.name,
        shop: {
          name: shopUser.shop.name || '',
          phone: shopUser.shop.phone || '',
          address: shopUser.shop.address || '',
          city: shopUser.shop.city || '',
          state: shopUser.shop.state || '',
          zip: shopUser.shop.zip || '',
          timezone: shopUser.shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          repairFocus: (shopUser.shop as any).repairFocus || [],
          businessHours: (shopUser.shop as any).businessHours || {},
          features: shopUser.shop.features,
        },
      }}
    />
  )
}



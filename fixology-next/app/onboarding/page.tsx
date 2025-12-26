import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { OnboardingWizard } from './wizard'

export const metadata = {
  title: 'Onboarding',
}

export default async function OnboardingPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/onboarding')
  }

  const shopUser = await prisma.shopUser.findFirst({
    where: {
      email: session.user.email!,
      status: 'ACTIVE',
    },
    include: { shop: true },
  })

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



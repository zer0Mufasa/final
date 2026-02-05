import { Suspense } from 'react'
import { OnboardingClient } from './onboarding-client'

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--text-primary)]/60">
          Loading…
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  )
}



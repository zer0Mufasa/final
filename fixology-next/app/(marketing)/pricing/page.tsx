// app/(marketing)/pricing/page.tsx
// Marketing pricing page

import { PricingCards } from '@/components/pricing-cards'
import { MarketingNav } from '@/components/marketing/mobile-nav'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#07070a]">
      <MarketingNav />
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Start your free trial today. No credit card required.
          </p>
        </div>

        <PricingCards />

        <div className="mt-16 text-center text-sm text-white/40">
          <p>✓ No credit card required for trial</p>
          <p className="mt-1">✓ Cancel anytime, no questions asked</p>
          <p className="mt-1">✓ All plans include free onboarding support</p>
        </div>
      </div>
    </div>
  )
}

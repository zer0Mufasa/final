import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/mobile-nav'

export const metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <MarketingNav />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-white/60 hover:text-white/80">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-4xl font-bold">Terms of Service</h1>
          <p className="mt-3 text-white/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Agreement</h2>
            <p>
              By accessing or using Fixology (“Services”), you agree to these Terms. If you do not agree, do not use the
              Services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Accounts</h2>
            <p>
              You are responsible for safeguarding your credentials and for activity under your account. You must
              provide accurate information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Subscriptions & billing</h2>
            <p>
              Paid plans are billed via Stripe. Trials may convert to paid unless cancelled. If payment fails, access may
              be limited until resolved.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Acceptable use</h2>
            <p>
              You agree not to misuse the Services, including attempting to access data you do not own, disrupting the
              platform, or violating applicable laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Customer data</h2>
            <p>
              You control the customer data you upload to Fixology. You represent you have the rights and permissions to
              process that data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Fixology will not be liable for indirect or consequential damages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p>
              Questions? Contact us at{' '}
              <Link className="text-violet-300 hover:text-violet-200 underline" href="/contact">
                /contact
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


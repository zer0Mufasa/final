import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/mobile-nav'

export const metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      <MarketingNav />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-10">
          <Link href="/" className="text-sm text-white/60 hover:text-white/80">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-3 text-white/60">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Overview</h2>
            <p>
              This Privacy Policy explains how Fixology (“we”, “us”) collects, uses, and shares information when you use
              our website and services (“Services”).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Information we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Account information</strong> (name, email, phone, shop details).
              </li>
              <li>
                <strong>Customer data you enter</strong> (customers, tickets, invoices, messages).
              </li>
              <li>
                <strong>Usage data</strong> (pages viewed, feature usage, diagnostics events).
              </li>
              <li>
                <strong>Billing information</strong> (processed by Stripe; we store limited billing identifiers).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">How we use information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve the Services.</li>
              <li>Authenticate users and secure accounts.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Send service-related emails (account, billing, support).</li>
              <li>Prevent abuse and maintain platform safety.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Sharing</h2>
            <p>
              We share information with service providers that help us run the Services (for example, hosting, analytics,
              email delivery, and payments). We do not sell your personal information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Security</h2>
            <p>
              We use reasonable safeguards to protect your information. No method of transmission or storage is 100%
              secure.
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


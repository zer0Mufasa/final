import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripeServer() {
  if (stripe) return stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  stripe = new Stripe(key, {
    // Let the Stripe SDK pick its default pinned API version.
  })
  return stripe
}



export type StripeCheckoutPlan = 'starter' | 'professional' | 'enterprise'

export function getTrialDays() {
  const raw = process.env.STRIPE_TRIAL_DAYS?.trim()
  const n = raw ? Number(raw) : 14
  // Requirement: 7–14 days configured in code
  if (!Number.isFinite(n) || n < 7 || n > 14) return 14
  return Math.floor(n)
}

export function getPriceIdForPlan(plan: Exclude<StripeCheckoutPlan, 'enterprise'>) {
  if (plan === 'starter') {
    const id = process.env.STRIPE_PRICE_STARTER
    if (!id) throw new Error('Missing STRIPE_PRICE_STARTER')
    return id
  }
  const id = process.env.STRIPE_PRICE_PROFESSIONAL
  if (!id) throw new Error('Missing STRIPE_PRICE_PROFESSIONAL')
  return id
}

export function mapPlanToDbPlan(plan: Exclude<StripeCheckoutPlan, 'enterprise'>) {
  return plan === 'starter' ? 'STARTER' : 'PRO'
}



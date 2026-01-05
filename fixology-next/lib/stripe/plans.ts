export type StripeCheckoutPlan = 'starter' | 'professional' | 'enterprise'

export const PLANS = {
  STARTER: {
    id: 'STARTER',
    name: 'Fixology Starter',
    price: 99,
    productId: 'prod_TgN0Dbs0jwWFod',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_1Sj0GWI3u6N6tWwNh2W1G8ay', // $99/month
    trialDays: 14,
    features: [
      'POS Dashboard',
      'Ticket Management',
      'Customer Database',
      '1 Team Member',
      'Email Support',
      'Basic Reports',
    ],
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Fixology Professional',
    price: 249,
    productId: 'prod_TgN1qedQzMnGHn',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_1Sj0HCI3u6N6tWwNG0Ctitq7', // $249/month
    trialDays: 30,
    features: [
      'Everything in Starter',
      'AI Diagnostics (GPT)',
      'Inventory Management',
      'Advanced Reports & Analytics',
      'Autopilot SMS/Email',
      '5 Team Members',
      'Priority Support',
      'Custom Branding',
    ],
  },
} as const

export function getTrialDays(plan: 'starter' | 'professional' = 'starter') {
  if (plan === 'starter') return PLANS.STARTER.trialDays
  return PLANS.PROFESSIONAL.trialDays
}

export function getPriceIdForPlan(plan: Exclude<StripeCheckoutPlan, 'enterprise'>) {
  if (plan === 'starter') {
    return PLANS.STARTER.priceId
  }
  return PLANS.PROFESSIONAL.priceId
}

export function mapPlanToDbPlan(plan: Exclude<StripeCheckoutPlan, 'enterprise'>) {
  return plan === 'starter' ? 'STARTER' : 'PRO'
}



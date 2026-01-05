# Stripe Subscription Billing Setup

## Environment Variables

✅ **Environment variables have been added to `.env.local`**

Update these placeholders with your actual Stripe keys:

```env
# Stripe Keys (Test mode - replace with live keys for production)
STRIPE_SECRET_KEY=sk_test_xxx  # Replace with your actual secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # Replace with your actual publishable key

# Webhook Secret (get after creating webhook endpoint - see STRIPE-WEBHOOK-SETUP.md)
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Replace after webhook setup

# Price IDs (replace with your actual price IDs from Stripe Dashboard)
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx

# Customer Portal Configuration ID
STRIPE_PORTAL_CONFIGURATION_ID=bpc_1SmHiBI3u6N6tWwNXl9uapzh

# Site URLs
NEXT_PUBLIC_SITE_URL=https://www.fixologyai.com
SITE_URL=https://www.fixologyai.com
NEXT_PUBLIC_APP_URL=https://www.fixologyai.com
```

## Plans Configuration

- **Starter**: $99/month, 14 days free trial
  - Product ID: `prod_TgN0Dbs0jwWFod`
  - Price ID: Get from Stripe Dashboard → Products → Starter → Pricing
  
- **Professional**: $249/month, 30 days free trial
  - Product ID: `prod_TgN1qedQzMnGHn`
  - Price ID: Get from Stripe Dashboard → Products → Professional → Pricing

## Stripe Dashboard Setup

### 1. Get Your Price IDs

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click on **"Fixology Starter"** product
3. Under **Pricing**, copy the Price ID (starts with `price_`)
4. Add it to `.env.local` as `STRIPE_PRICE_STARTER`
5. Repeat for **"Fixology Professional"** → `STRIPE_PRICE_PROFESSIONAL`

### 2. Get Your API Keys

1. Go to Stripe Dashboard → **Developers** → **API Keys**
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Add them to `.env.local`

### 3. Set Up Webhooks

**See detailed guide:** [`STRIPE-WEBHOOK-SETUP.md`](./STRIPE-WEBHOOK-SETUP.md)

Quick steps:
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://www.fixologyai.com/api/stripe/webhook`
4. Select required events (see webhook setup guide)
5. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Customer Portal Configuration

✅ **Already configured:** `bpc_1SmHiBI3u6N6tWwNXl9uapzh`

The portal configuration ID has been added to your environment variables. The customer portal allows users to:
- Update payment methods
- View invoice history
- Cancel subscriptions

## API Routes

- `/api/stripe/checkout` - Create checkout session
- `/api/stripe/webhook` - Handle Stripe webhooks
- `/api/stripe/create-portal` - Open customer portal
- `/api/stripe/subscription` - Get subscription status
- `/api/stripe/change-plan` - Upgrade/downgrade plan

## Pages

- `/pricing` - Marketing pricing page ([https://www.fixologyai.com/pricing](https://www.fixologyai.com/pricing))
- `/dashboard/settings/billing` - Billing settings page

## Testing

### Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Auth Required**: `4000 0025 0000 3155`

Use any future expiry (e.g., 12/34) and any 3-digit CVC.

### Test Webhook Locally

Use Stripe CLI (see `STRIPE-WEBHOOK-SETUP.md`):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

## Features

✅ New signups with free trials (14 or 30 days)
✅ Stripe Checkout for payments
✅ Automatic status updates via webhooks
✅ Customer portal for managing billing
✅ Plan upgrades/downgrades
✅ Failed payment handling
✅ Trial period tracking

## Next Steps

1. ✅ Environment variables added to `.env.local`
2. ⏳ **Replace placeholders** with actual Stripe keys
3. ⏳ **Set up webhooks** (see `STRIPE-WEBHOOK-SETUP.md`)
4. ⏳ **Get Price IDs** from Stripe Dashboard
5. ⏳ **Test checkout flow** with test cards
6. ⏳ **Verify webhook** receives events

## Need Help?

- **Webhook Setup**: See [`STRIPE-WEBHOOK-SETUP.md`](./STRIPE-WEBHOOK-SETUP.md)
- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
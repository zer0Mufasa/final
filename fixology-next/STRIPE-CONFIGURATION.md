# Stripe Configuration Summary

## ✅ Live Configuration

Your Stripe integration is configured with **LIVE** keys and ready for production.

### Environment Variables (`.env.local`)

```env
# Stripe Live Keys (Add your actual keys from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Price IDs (Get from Stripe Dashboard → Products → Pricing)
STRIPE_PRICE_STARTER=price_1Sj0GWI3u6N6tWwNh2W1G8ay      # $99/month
STRIPE_PRICE_PROFESSIONAL=price_1Sj0HCI3u6N6tWwNG0Ctitq7  # $249/month

# Webhook Configuration (Get from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_WEBHOOK_ENDPOINT_ID=we_xxxxx

# Customer Portal (Get from Stripe Dashboard → Settings → Billing)
STRIPE_PORTAL_CONFIGURATION_ID=bpc_xxxxx

# Site URLs
NEXT_PUBLIC_SITE_URL=https://www.fixologyai.com
SITE_URL=https://www.fixologyai.com
NEXT_PUBLIC_APP_URL=https://www.fixologyai.com
```

## Plans Configuration

### Starter Plan
- **Price**: $99/month
- **Trial**: 14 days free
- **Product ID**: `prod_TgN0Dbs0jwWFod`
- **Price ID**: `price_1Sj0GWI3u6N6tWwNh2W1G8ay`
- **Amount**: $99.00 USD (9900 cents)

### Professional Plan
- **Price**: $249/month
- **Trial**: 30 days free
- **Product ID**: `prod_TgN1qedQzMnGHn`
- **Price ID**: `price_1Sj0HCI3u6N6tWwNG0Ctitq7`
- **Amount**: $249.00 USD (24900 cents)

## Webhook Endpoint

- **Endpoint ID**: `we_1SmHwXI3u6N6tWwNbRBHtpXF`
- **URL**: `https://www.fixologyai.com/api/stripe/webhook`
- **Signing Secret**: `whsec_3COUZoItlzuR9B7ZG72Gf1ulH1btbkpJ`

### Webhook Events Configured

The webhook endpoint should be listening for:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

## Customer Portal

- **Configuration ID**: `bpc_1SmHiBI3u6N6tWwNXl9uapzh`
- **Return URL**: `https://www.fixologyai.com/dashboard/settings/billing`

## Testing

⚠️ **Important**: You're using **LIVE** keys, so all transactions will be real charges.

For testing, you can:
1. Use Stripe Dashboard → Test mode to switch to test keys temporarily
2. Or create a separate test webhook endpoint for development

## Verification Checklist

- [x] Live Stripe keys configured
- [x] Price IDs set correctly
- [x] Webhook secret configured
- [x] Customer portal configuration ID set
- [x] Site URLs set to production domain
- [ ] Webhook endpoint verified in Stripe Dashboard
- [ ] Test checkout flow completed
- [ ] Webhook events received successfully

## Next Steps

1. **Verify Webhook**: Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Check endpoint `we_1SmHwXI3u6N6tWwNbRBHtpXF` is active
2. **Test Checkout**: Visit `/pricing` and complete a test subscription
3. **Monitor Webhooks**: Check webhook logs in Stripe Dashboard to ensure events are being received
4. **Test Portal**: Try opening the customer portal from `/dashboard/settings/billing`

## Support

- Stripe Dashboard: https://dashboard.stripe.com
- Webhook Logs: https://dashboard.stripe.com/webhooks
- API Reference: https://stripe.com/docs/api

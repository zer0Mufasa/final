## Fixology launch checklist

### Environment variables (copy into `.env.local`)

```bash
# Stripe (REQUIRED)
STRIPE_SECRET_KEY=sk_test_xxx          # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Get when creating webhook endpoint
STRIPE_PRICE_STARTER=price_xxx         # Get from Products → Starter → Pricing
STRIPE_PRICE_PROFESSIONAL=price_xxx    # Get from Products → Professional → Pricing

# Email (REQUIRED)
RESEND_API_KEY=re_xxx                  # Get from resend.com
RESEND_FROM_EMAIL=hello@fixologyai.com # Must verify domain in Resend
CONTACT_TO=support@fixologyai.com      # Where contact form goes
CONTACT_FROM=noreply@fixologyai.com    # From address for system emails

# Sentry (RECOMMENDED)
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=same_as_above

# Existing (you should already have)
DATABASE_URL=xxx
DIRECT_URL=xxx
NEXT_PUBLIC_SITE_URL=https://fixologyai.com
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Admin launch readiness page

- Log into admin: `/admin/login`
- Open: `/admin/launch-readiness`
- Make sure everything is GREEN
- Click **Send test email**

### Manual test checklist

Before going live, manually test:

- [ ] Sign up as new user
- [ ] Complete Stripe checkout (test card `4242 4242 4242 4242`)
- [ ] Verify webhook fires (Stripe Dashboard → Webhooks → Logs)
- [ ] Verify `Shop` record updated (`plan`, `status`, `stripeCustomerId`, `stripeSubscriptionId`)
- [ ] Access dashboard after payment
- [ ] Test password reset flow (`/forgot-password` → `/reset-password`)
- [ ] Test contact form (`/contact`)
- [ ] View `/terms` and `/privacy` pages
- [ ] Check mobile layout on a real phone
- [ ] Check Sentry receives a test error (optional)


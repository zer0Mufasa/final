# Stripe Webhook Setup Guide

## Quick Setup Steps

### 1. Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in the correct mode (Test mode for development, Live mode for production)
3. Navigate to **Developers** → **Webhooks** in the left sidebar

### 2. Create Webhook Endpoint

#### For Production (Live Mode):
1. Click **"Add endpoint"** button (top right)
2. **Endpoint URL**: `https://www.fixologyai.com/api/stripe/webhook`
3. **Description**: "Fixology Subscription Webhooks"

#### For Development (Test Mode):
1. Click **"Add endpoint"** button
2. **Endpoint URL**: `https://your-ngrok-url.ngrok.io/api/stripe/webhook` (or your local tunnel URL)
   - Or use Stripe CLI (see below)
3. **Description**: "Fixology Dev Webhooks"

### 3. Select Events to Listen To

Click **"Select events"** and choose these events:

**Required Events:**
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**Optional but Recommended:**
- `customer.subscription.paused`
- `customer.subscription.resumed`
- `invoice.payment_action_required`

### 4. Copy Webhook Secret

After creating the endpoint:
1. Click on your newly created webhook endpoint
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)
4. Add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### 5. Test Your Webhook

#### Option A: Using Stripe Dashboard
1. Go to your webhook endpoint page
2. Click **"Send test webhook"**
3. Select an event (e.g., `checkout.session.completed`)
4. Click **"Send test webhook"**
5. Check the **"Logs"** tab to see if it was received successfully

#### Option B: Using Stripe CLI (Recommended for Local Development)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   
   This will output a webhook signing secret like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxx
   ```
   
   Copy this secret to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

4. **Trigger test events:**
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed
   
   # Test subscription creation
   stripe trigger customer.subscription.created
   
   # Test payment success
   stripe trigger invoice.payment_succeeded
   ```

### 6. Verify Webhook is Working

Check your webhook logs in Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Logs"** tab
4. You should see successful requests (200 status codes)

If you see errors:
- **401/403**: Check your webhook secret in `.env.local`
- **404**: Verify the webhook URL is correct
- **500**: Check your server logs for errors

## Production Checklist

Before going live:

- [ ] Webhook endpoint created in **Live mode** (not Test mode)
- [ ] Webhook URL is `https://www.fixologyai.com/api/stripe/webhook`
- [ ] All required events are selected
- [ ] Webhook secret copied to production environment variables
- [ ] Test webhook sent and received successfully
- [ ] Webhook logs show 200 status codes

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is accessible:**
   ```bash
   curl https://www.fixologyai.com/api/stripe/webhook
   ```
   Should return a 405 Method Not Allowed (not 404)

2. **Verify webhook secret matches:**
   - Check `.env.local` has correct `STRIPE_WEBHOOK_SECRET`
   - Make sure you're using the secret from the correct mode (test vs live)

3. **Check server logs:**
   - Look for webhook errors in your application logs
   - Stripe Dashboard → Webhooks → Logs shows delivery attempts

### Webhook Returns 500 Error

1. Check your server logs for the actual error
2. Common issues:
   - Database connection errors
   - Missing environment variables
   - Invalid shop ID in metadata

### Testing Webhooks Locally

For local development, use Stripe CLI (see Option B above) or:

1. Use ngrok to expose localhost:
   ```bash
   ngrok http 3000
   ```
2. Use the ngrok URL in your webhook endpoint
3. Update when ngrok URL changes

## Webhook Event Flow

```
Stripe Event → Webhook Endpoint → Verify Signature → Process Event → Update Database
```

Your webhook handler (`app/api/stripe/webhook/route.ts`) automatically:
- Verifies the webhook signature
- Processes subscription events
- Updates shop status in database
- Handles payment failures
- Tracks trial periods

## Need Help?

If you're still having issues:
1. Check Stripe Dashboard → Webhooks → Logs for detailed error messages
2. Review your server logs for application errors
3. Verify all environment variables are set correctly
4. Test with Stripe CLI for local development

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events
 */

const { handleCors, sendSuccess, sendError, appendToLog } = require('../lib/utils');
const { updateShop, getShopById } = require('../lib/auth');

const PLAN_LIMITS = {
  basic: 100,
  pro: 400,
  enterprise: 999999
};

module.exports = async function handler(req, res) {
  // Special CORS handling for webhooks
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // If Stripe is not configured, log and return success
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      console.log('Stripe webhook received but Stripe not configured');
      return sendSuccess(res, { received: true, demo: true });
    }

    const stripe = require('stripe')(stripeKey);
    const sig = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const rawBody = req.body;
      try {
        event = stripe.webhooks.constructEvent(
          typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return sendError(res, 'Webhook signature verification failed', 400);
      }
    } else {
      // No webhook secret, use body directly (not recommended for production)
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { shopId, plan } = session.metadata || {};

        if (shopId && plan) {
          const renewalDate = new Date();
          renewalDate.setMonth(renewalDate.getMonth() + 1);

          await updateShop(shopId, {
            subscriptionPlan: plan,
            renewalDate: renewalDate.toISOString(),
            imeiChecksUsed: 0,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription
          });

          await appendToLog('billing-log.json', {
            event: 'subscription_created',
            shopId,
            plan,
            amount: session.amount_total,
            currency: session.currency
          });

          console.log(`Shop ${shopId} upgraded to ${plan}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find shop by Stripe customer ID and renew
        // This would require a lookup - simplified for now
        await appendToLog('billing-log.json', {
          event: 'invoice_paid',
          customerId,
          amount: invoice.amount_paid,
          currency: invoice.currency
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await appendToLog('billing-log.json', {
          event: 'subscription_updated',
          subscriptionId: subscription.id,
          status: subscription.status
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Downgrade shop to free plan
        await appendToLog('billing-log.json', {
          event: 'subscription_cancelled',
          subscriptionId: subscription.id
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return sendSuccess(res, { received: true });

  } catch (err) {
    console.error('Webhook error:', err.message);
    return sendError(res, 'Webhook processing failed', 500);
  }
};

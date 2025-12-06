/**
 * POST /api/billing/webhook
 * Stripe webhook handler
 */

const { sendSuccess, sendError, setCorsHeaders } = require('../../lib/utils');
const { findShopById, updateShop } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  // Webhooks don't need CORS but need raw body
  setCorsHeaders(res, req);

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey) {
      console.log('Stripe not configured');
      return sendSuccess(res, { received: true, mode: 'development' });
    }

    const stripe = require('stripe')(stripeKey);
    const sig = req.headers['stripe-signature'];

    let event;

    if (webhookSecret && sig) {
      try {
        // Verify webhook signature
        const rawBody = JSON.stringify(req.body);
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return sendError(res, 'Invalid signature', 400);
      }
    } else {
      // Dev mode - use body directly
      event = req.body;
    }

    console.log('Stripe webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const shopId = session.client_reference_id || session.metadata?.shopId;
        const plan = session.metadata?.plan;

        if (shopId && plan) {
          const limits = {
            basic: 100,
            pro: 400,
            enterprise: -1 // Unlimited
          };

          await updateShop(shopId, {
            subscriptionPlan: plan,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            imeiChecksLimit: limits[plan] || 100,
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          console.log(`Shop ${shopId} upgraded to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Handle subscription updates
        console.log('Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Handle subscription cancellation
        const shopId = subscription.metadata?.shopId;
        if (shopId) {
          await updateShop(shopId, {
            subscriptionPlan: 'free',
            subscriptionStatus: 'cancelled',
            imeiChecksLimit: 10
          });
          console.log(`Shop ${shopId} subscription cancelled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for:', invoice.customer);
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


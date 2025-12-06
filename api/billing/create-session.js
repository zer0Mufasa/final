/**
 * POST /api/billing/create-session
 * Create Stripe checkout session
 */

const { handleCors, sendSuccess, sendError } = require('../lib/utils');
const { requireAuth, updateShop } = require('../lib/auth');

// Stripe price IDs - replace with your actual Stripe price IDs
const STRIPE_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic_monthly',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly'
};

const PLAN_DETAILS = {
  basic: { name: 'Basic Plan', price: 2900, imeiLimit: 100 },
  pro: { name: 'Pro Plan', price: 7900, imeiLimit: 400 },
  enterprise: { name: 'Enterprise Plan', price: 19900, imeiLimit: 999999 }
};

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const auth = await requireAuth(req, res);
    if (auth.error) {
      return sendError(res, auth.error, auth.status);
    }

    const { plan, mode } = req.body || {};

    // Setup mode for adding payment method
    if (mode === 'setup') {
      // In production, create actual Stripe setup session
      return sendSuccess(res, {
        url: `${process.env.FRONTEND_URL || 'https://fixologyai.com'}/billing.html?setup=pending`,
        message: 'Setup session created'
      });
    }

    if (!plan || !PLAN_DETAILS[plan]) {
      return sendError(res, 'Invalid plan selected', 400);
    }

    const planDetail = PLAN_DETAILS[plan];
    const shopId = auth.user?.id;
    const email = auth.user?.email;

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (stripeKey && stripeKey.startsWith('sk_')) {
      // Real Stripe integration
      const stripe = require('stripe')(stripeKey);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: STRIPE_PRICES[plan],
          quantity: 1
        }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'https://fixologyai.com'}/receipt.html?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://fixologyai.com'}/upgrade.html?cancelled=true`,
        customer_email: email,
        metadata: {
          shopId,
          plan
        }
      });

      return sendSuccess(res, {
        sessionId: session.id,
        url: session.url
      });
    } else {
      // Demo mode - simulate checkout
      console.log(`Demo checkout: ${email} upgrading to ${plan}`);
      
      // Update shop subscription directly for demo
      if (shopId) {
        await updateShop(shopId, {
          subscriptionPlan: plan,
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          imeiChecksUsed: 0
        });
      }

      return sendSuccess(res, {
        url: `${process.env.FRONTEND_URL || 'https://fixologyai.com'}/receipt.html?plan=${plan}&demo=true`,
        message: 'Demo checkout - subscription updated',
        demo: true
      });
    }

  } catch (err) {
    console.error('Billing session error:', err.message);
    return sendError(res, 'Failed to create checkout session', 500);
  }
};

/**
 * POST /api/billing/create-session
 * Create Stripe checkout session for subscription
 */

const { handleCors, sendSuccess, sendError, validateRequired } = require('../../lib/utils');
const { requireAuth } = require('../../lib/auth');

// Plan configurations
const PLANS = {
  basic: {
    name: 'Shop Basic',
    price: 2900, // $29.00 in cents
    imeiLimit: 100,
    features: ['100 IMEI checks/month', 'Basic diagnostics', 'Email support']
  },
  pro: {
    name: 'Shop Pro',
    price: 7900, // $79.00
    imeiLimit: 400,
    features: ['400 IMEI checks/month', 'Full diagnostics', 'Priority support', 'Website builder']
  },
  enterprise: {
    name: 'Shop Enterprise',
    price: 19900, // $199.00
    imeiLimit: -1, // Unlimited
    features: ['Unlimited IMEI checks', 'All features', 'Dedicated support', 'API access', 'Custom branding']
  }
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

    if (auth.type !== 'shop') {
      return sendError(res, 'Only shop accounts can subscribe to plans', 403);
    }

    const body = req.body || {};
    const { plan } = body;

    if (!plan || !PLANS[plan]) {
      return sendError(res, 'Invalid plan. Choose: basic, pro, or enterprise', 400);
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      // Dev mode - return mock session
      console.log('Stripe not configured, returning mock session');
      return sendSuccess(res, {
        sessionId: 'mock_session_' + Date.now(),
        url: `https://fixologyai.com/billing-success.html?plan=${plan}&mock=true`,
        plan: PLANS[plan],
        mode: 'development'
      });
    }

    const stripe = require('stripe')(stripeKey);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: auth.shop.email,
      client_reference_id: auth.shop.id,
      metadata: {
        shopId: auth.shop.id,
        shopName: auth.shop.shopName,
        plan: plan
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: PLANS[plan].name,
              description: PLANS[plan].features.join(', ')
            },
            unit_amount: PLANS[plan].price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      success_url: `https://fixologyai.com/billing-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://fixologyai.com/upgrade.html?cancelled=true`
    });

    return sendSuccess(res, {
      sessionId: session.id,
      url: session.url,
      plan: PLANS[plan]
    });

  } catch (err) {
    console.error('Billing session error:', err.message);
    return sendError(res, 'Failed to create checkout session', 500);
  }
};


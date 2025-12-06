/**
 * POST /api/autopilot/generate
 * AI-powered content generation for shops
 */

const { handleCors, sendSuccess, sendError, sanitizeInput } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

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
      return sendError(res, 'Only shop accounts can use Autopilot', 403);
    }

    const plan = auth.shop.subscriptionPlan;
    if (!['pro', 'enterprise'].includes(plan)) {
      return sendError(res, 'Autopilot requires Pro or Enterprise plan', 403);
    }

    const body = req.body || {};
    const { type, context } = body;

    if (!type) {
      return sendError(res, 'Generation type is required', 400);
    }

    // Generate content based on type
    let generated = {};

    switch (type) {
      case 'repair_price':
        generated = generateRepairPrice(context, auth.shop);
        break;

      case 'customer_response':
        generated = generateCustomerResponse(context, auth.shop);
        break;

      case 'website_about':
        generated = generateAboutSection(auth.shop);
        break;

      case 'invoice':
        generated = generateInvoice(context, auth.shop);
        break;

      case 'upsell':
        generated = generateUpsell(context, auth.shop);
        break;

      default:
        return sendError(res, 'Unknown generation type', 400);
    }

    return sendSuccess(res, {
      type,
      generated
    });

  } catch (err) {
    console.error('Autopilot error:', err.message);
    return sendError(res, 'Failed to generate content', 500);
  }
};

// AI Generation Functions (Templates - would be enhanced with LLM in production)

function generateRepairPrice(context, shop) {
  const { device, repairType, condition } = context || {};
  
  // Base prices by repair type
  const basePrices = {
    screen: { min: 79, max: 299 },
    battery: { min: 39, max: 89 },
    charging_port: { min: 49, max: 99 },
    back_glass: { min: 59, max: 149 },
    camera: { min: 69, max: 199 },
    speaker: { min: 39, max: 79 },
    button: { min: 29, max: 69 }
  };

  const price = basePrices[repairType] || { min: 49, max: 149 };
  const midPrice = Math.round((price.min + price.max) / 2);

  return {
    device: device || 'Unknown Device',
    repairType: repairType || 'general',
    suggestedPrice: midPrice,
    priceRange: price,
    laborTime: '30-60 minutes',
    recommendation: `Based on market rates, we suggest pricing this ${repairType} repair at $${midPrice}. Adjust based on parts quality and local competition.`,
    competitiveNote: 'This price is competitive for your area.'
  };
}

function generateCustomerResponse(context, shop) {
  const { customerMessage, sentiment } = context || {};
  
  const greetings = [
    `Thank you for reaching out to ${shop.shopName}!`,
    `Hi there! Thanks for contacting ${shop.shopName}.`,
    `Hello! We appreciate you choosing ${shop.shopName}.`
  ];

  const responses = {
    inquiry: `We'd be happy to help with your device. Please bring it in for a free diagnostic, or share more details about the issue and we'll provide an estimate.`,
    complaint: `We're sorry to hear about your experience. Your satisfaction is our priority. Please let us know how we can make this right.`,
    positive: `Thank you so much for the kind words! We're glad we could help. Feel free to reach out anytime!`,
    default: `Thanks for your message. How can we assist you today?`
  };

  return {
    suggestedResponse: `${greetings[Math.floor(Math.random() * greetings.length)]} ${responses[sentiment] || responses.default}`,
    tone: 'friendly and professional',
    canEdit: true
  };
}

function generateAboutSection(shop) {
  return {
    title: `About ${shop.shopName}`,
    content: `Welcome to ${shop.shopName}, your trusted partner for professional device repair services${shop.city ? ` in ${shop.city}` : ''}. We specialize in fast, reliable repairs for smartphones, tablets, laptops, and more. Our certified technicians use high-quality parts and offer competitive pricing with quick turnaround times. Visit us today for a free diagnostic!`,
    highlights: [
      'Certified Technicians',
      'Quality Parts Guaranteed',
      'Fast Turnaround',
      'Free Diagnostics',
      'Competitive Pricing'
    ]
  };
}

function generateInvoice(context, shop) {
  const { customer, items, discount } = context || {};
  
  const subtotal = (items || []).reduce((sum, item) => sum + (item.price || 0), 0);
  const discountAmount = discount ? subtotal * (discount / 100) : 0;
  const tax = (subtotal - discountAmount) * 0.08; // 8% tax
  const total = subtotal - discountAmount + tax;

  return {
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    shopName: shop.shopName,
    shopAddress: shop.address,
    shopPhone: shop.phone,
    customerName: customer?.name || 'Customer',
    customerPhone: customer?.phone || '',
    date: new Date().toLocaleDateString(),
    items: items || [],
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    notes: 'Thank you for your business! 90-day warranty on all repairs.'
  };
}

function generateUpsell(context, shop) {
  const { device, repairType } = context || {};
  
  const upsells = {
    screen: [
      { item: 'Screen Protector', price: 19.99, reason: 'Protect your new screen from future damage' },
      { item: 'Phone Case', price: 24.99, reason: 'Add extra protection with a premium case' }
    ],
    battery: [
      { item: 'Wireless Charger', price: 29.99, reason: 'Convenient charging extends battery lifespan' },
      { item: 'Power Bank', price: 34.99, reason: 'Stay charged on the go' }
    ],
    charging_port: [
      { item: 'Quality Charging Cable', price: 14.99, reason: 'Prevent future port damage with certified cables' },
      { item: 'Wireless Charger', price: 29.99, reason: 'Reduce wear on your charging port' }
    ],
    default: [
      { item: 'Device Cleaning', price: 9.99, reason: 'Complete internal cleaning for better performance' },
      { item: 'Screen Protector', price: 19.99, reason: 'Protect your device from scratches' }
    ]
  };

  return {
    suggestions: upsells[repairType] || upsells.default,
    pitch: `Since you're getting a ${repairType || 'repair'}, consider these add-ons to maximize your device's protection and longevity.`
  };
}


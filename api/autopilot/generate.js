/**
 * POST /api/autopilot/generate
 * AI Autopilot content generation
 */

const { handleCors, sendSuccess, sendError } = require('../lib/utils');
const { requireAuth } = require('../lib/auth');

// Simulated AI responses - in production, connect to actual LLM
const generators = {
  pricing: (context) => {
    const { device, repairs } = context;
    const basePrices = {
      screen: { min: 79, max: 299 },
      battery: { min: 39, max: 99 },
      'charging port': { min: 49, max: 129 },
      camera: { min: 69, max: 199 },
      speaker: { min: 39, max: 89 },
      'back glass': { min: 49, max: 149 }
    };

    let output = `💰 SUGGESTED PRICING FOR ${device || 'Device'}\n\n`;
    
    (repairs || ['screen', 'battery']).forEach(repair => {
      const prices = basePrices[repair.toLowerCase()] || { min: 50, max: 150 };
      const suggested = Math.round((prices.min + prices.max) / 2);
      output += `${repair.charAt(0).toUpperCase() + repair.slice(1)} Repair:\n`;
      output += `  • Grade A Parts: $${prices.max}\n`;
      output += `  • Grade B Parts: $${suggested}\n`;
      output += `  • Aftermarket: $${prices.min}\n\n`;
    });

    output += `📊 Market Analysis: Prices are competitive for your area.\n`;
    output += `💡 Tip: Consider bundling screen + battery for 10% discount.`;
    
    return output;
  },

  replies: (context) => {
    const { customerMessage, customerName } = context;
    const name = customerName || 'there';
    
    return `Hi ${name}! 👋

Thanks for reaching out to us!

For an iPhone 13 screen repair, our pricing is:
• Premium OEM Quality: $179
• High-Quality Aftermarket: $129

Both options include:
✅ 90-day warranty
✅ Same-day service (most repairs)
✅ Free diagnostic check

Would you like to schedule an appointment? We have availability today!

Best regards,
Your Repair Team 🔧`;
  },

  website: (context) => {
    const { section, shopName } = context;
    const name = shopName || 'Your Shop';

    if (section === 'about') {
      return `ABOUT ${name.toUpperCase()}

Welcome to ${name} – your trusted destination for professional device repair services.

With over 5 years of experience in the industry, our certified technicians have successfully repaired thousands of devices, from cracked screens to complex motherboard issues.

🎯 Our Mission
To provide fast, affordable, and reliable repair services that get your devices back in your hands quickly.

💪 Why Choose Us?
• Certified technicians with years of experience
• Premium quality parts with warranty
• Most repairs completed same-day
• Transparent pricing with no hidden fees
• Friendly customer service

📍 Visit us today or give us a call for a free quote!`;
    }

    return `[${section || 'Content'} section generated for ${name}]`;
  },

  invoices: (context) => {
    const { customer, device, repairs } = context;
    const total = repairs?.reduce((sum, r) => sum + (r.price || 0), 0) || 0;
    const tax = Math.round(total * 0.08);
    
    return `═══════════════════════════════════
        REPAIR INVOICE
═══════════════════════════════════

Customer: ${customer || 'Customer Name'}
Device: ${device || 'Device'}
Date: ${new Date().toLocaleDateString()}
Invoice #: INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}

───────────────────────────────────
SERVICES RENDERED:
───────────────────────────────────
${(repairs || []).map(r => `${r.name.padEnd(25)} $${r.price?.toFixed(2) || '0.00'}`).join('\n')}

───────────────────────────────────
Subtotal:                  $${total.toFixed(2)}
Tax (8%):                  $${tax.toFixed(2)}
───────────────────────────────────
TOTAL:                     $${(total + tax).toFixed(2)}
═══════════════════════════════════

Thank you for choosing us!
90-day warranty on all repairs.`;
  },

  upsells: (context) => {
    const { device, currentRepair } = context;
    
    return `📈 UPSELL OPPORTUNITIES

For ${device || 'this device'} with ${currentRepair || 'repair'}:

🔋 Battery Health Check (+$0)
   "While we have it open, we can check your battery health for free!"

🛡️ Screen Protector (+$19.99)
   "Protect your new screen with a tempered glass protector - 50% off with repair!"

📱 Phone Case (+$24.99)
   "Keep it protected! 20% off cases when bundled with repair."

🔌 Fast Charger (+$14.99)
   "Upgrade to a fast charger - charges 3x faster!"

💰 Estimated Additional Revenue: $45-$80
📊 Average Acceptance Rate: 35%`;
  },

  diagnostics: (context) => {
    const { device, issues } = context;
    
    return `🩺 DIAGNOSTIC SUMMARY
Device: ${device || 'Unknown Device'}

───────────────────────────────────
ISSUES FOUND:
───────────────────────────────────
${(issues || ['General inspection']).map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

───────────────────────────────────
CUSTOMER-FRIENDLY EXPLANATION:
───────────────────────────────────
"Hi! We've completed the diagnostic on your ${device || 'device'}. Here's what we found:

${issues?.[0] ? `• Your battery is showing signs of wear and may need replacement soon to restore normal usage time.` : ''}
${issues?.[1] ? `• The camera module needs recalibration or replacement to fix the focusing issue.` : ''}
${issues?.[2] ? `• The speaker has some debris or damage causing the audio issues.` : ''}

We recommend addressing the battery first as it's affecting your daily usage the most. Would you like us to proceed with the repair?"

───────────────────────────────────
RECOMMENDED ACTIONS:
───────────────────────────────────
✅ Battery replacement (Priority: High)
✅ Camera repair (Priority: Medium)  
✅ Speaker cleaning/repair (Priority: Low)`;
  }
};

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    // Optionally require auth
    const auth = await requireAuth(req, res);
    if (auth.error) {
      // Allow unauthenticated for demo purposes
      console.log('Autopilot called without auth');
    }

    const { type, context } = req.body || {};

    if (!type) {
      return sendError(res, 'Type is required', 400);
    }

    const generator = generators[type];
    if (!generator) {
      return sendError(res, `Unknown generation type: ${type}`, 400);
    }

    const content = generator(context || {});

    return sendSuccess(res, {
      type,
      content,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Autopilot error:', err.message);
    return sendError(res, 'Generation failed', 500);
  }
};

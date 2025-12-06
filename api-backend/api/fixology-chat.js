/**
 * Fixology Chat API - Serverless Function
 * POST /api/fixology-chat
 * 
 * Provider-agnostic AI assistant for device diagnostics,
 * IMEI checks, and Fixology platform support.
 */

const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://fixologyai.com',
  'https://www.fixologyai.com',
  'https://final-oc9r.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

function setCorsHeaders(res, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ═══════════════════════════════════════════════════════════════════
// DATA LOADERS
// ═══════════════════════════════════════════════════════════════════

let cachedDevices = null;
let cachedSymptoms = null;
let cachedRewards = null;
let cachedPricing = null;

async function loadDevices() {
  if (cachedDevices) return cachedDevices;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'devices.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedDevices = JSON.parse(data);
    return cachedDevices;
  } catch (err) {
    console.error('Failed to load devices.json:', err.message);
    return null;
  }
}

async function loadSymptoms() {
  if (cachedSymptoms) return cachedSymptoms;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'symptoms.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedSymptoms = JSON.parse(data);
    return cachedSymptoms;
  } catch (err) {
    console.error('Failed to load symptoms.json:', err.message);
    return null;
  }
}

async function loadRewards() {
  if (cachedRewards) return cachedRewards;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'rewards.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedRewards = JSON.parse(data);
    return cachedRewards;
  } catch (err) {
    console.error('Failed to load rewards.json:', err.message);
    return null;
  }
}

async function loadPricing() {
  if (cachedPricing) return cachedPricing;
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'pricing.json');
    const data = await fs.readFile(filePath, 'utf-8');
    cachedPricing = JSON.parse(data);
    return cachedPricing;
  } catch (err) {
    console.error('Failed to load pricing.json:', err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT DETECTION
// ═══════════════════════════════════════════════════════════════════

function detectIntent(message) {
  const lower = message.toLowerCase();
  
  // Check for IMEI-related queries
  const imeiPatterns = [
    /imei/i,
    /\b\d{14,17}\b/,  // 14-17 digit number
    /blacklist/i,
    /is.*(phone|device).*(stolen|lost|clean)/i,
    /find my (iphone|device)/i,
    /carrier.*(lock|unlock)/i,
    /sim.*(lock|unlock)/i,
    /check.*(serial|status)/i,
    /icloud.*(lock|status)/i,
    /mdm.*(lock|status)/i,
    /activation lock/i
  ];
  
  for (const pattern of imeiPatterns) {
    if (pattern.test(message)) {
      return 'imei_check';
    }
  }
  
  // Check for pricing-related queries
  const pricingPatterns = [
    /pric(e|ing)/i,
    /\b(cost|costs)\b/i,
    /how much/i,
    /subscription/i,
    /\b(plan|plans)\b/i,
    /\b(basic|pro|enterprise)\b.*plan/i,
    /per month/i,
    /monthly/i,
    /free trial/i,
    /discount/i
  ];
  
  for (const pattern of pricingPatterns) {
    if (pattern.test(message)) {
      return 'pricing';
    }
  }
  
  // Check for diagnosis-related queries
  const diagnosisPatterns = [
    /diagnos/i,
    /problem/i,
    /issue/i,
    /broken/i,
    /not working/i,
    /won'?t (turn on|charge|boot|connect)/i,
    /screen.*(crack|black|lines|flicker)/i,
    /battery.*(drain|dead|swollen|hot)/i,
    /water damage/i,
    /overheating/i,
    /slow/i,
    /crash/i,
    /freez/i,
    /restart/i,
    /speaker/i,
    /microphone/i,
    /camera/i,
    /wifi/i,
    /bluetooth/i,
    /charging/i,
    /repair/i,
    /fix/i,
    /symptom/i
  ];
  
  for (const pattern of diagnosisPatterns) {
    if (pattern.test(message)) {
      return 'diagnosis';
    }
  }
  
  return 'generic_support';
}

// ═══════════════════════════════════════════════════════════════════
// IMEI EXTRACTION & CHECK
// ═══════════════════════════════════════════════════════════════════

function extractIMEI(message) {
  // Look for 14-17 digit sequences (IMEI is typically 15 digits)
  const match = message.match(/\b(\d{14,17})\b/);
  return match ? match[1] : null;
}

async function checkIMEI(imei) {
  try {
    const response = await fetch('https://final-bice-phi.vercel.app/api/imei-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imei: imei, mode: 'full' })
    });
    
    if (!response.ok) {
      throw new Error(`IMEI API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('IMEI check failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// LLM CALL (PROVIDER-AGNOSTIC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Calls the configured LLM provider.
 * 
 * Environment variables required:
 * - LLM_PROVIDER: "anthropic" or "openai"
 * - LLM_API_KEY: Your API key for the chosen provider
 * 
 * Optional:
 * - LLM_MODEL: Override the default model
 */
async function callLLM({ systemPrompt, messages, context }) {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const apiKey = process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }
  
  // Build the full message array
  const fullMessages = messages.map(m => ({
    role: m.role === 'system' ? 'user' : m.role,
    content: m.content
  }));
  
  // Add context to the last user message if provided
  if (context && fullMessages.length > 0) {
    const lastIdx = fullMessages.length - 1;
    if (fullMessages[lastIdx].role === 'user') {
      fullMessages[lastIdx].content += `\n\n[CONTEXT DATA]\n${JSON.stringify(context, null, 2)}`;
    }
  }
  
  if (provider === 'openai') {
    return await callOpenAI({ systemPrompt, messages: fullMessages, apiKey });
  } else if (provider === 'anthropic') {
    return await callAnthropic({ systemPrompt, messages: fullMessages, apiKey });
  } else {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

async function callOpenAI({ systemPrompt, messages, apiKey }) {
  const model = process.env.LLM_MODEL || 'gpt-4o';
  
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 1024,
    temperature: 0.7
  };
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return { text: data.choices[0]?.message?.content || '' };
}

async function callAnthropic({ systemPrompt, messages, apiKey }) {
  const model = process.env.LLM_MODEL || 'claude-sonnet-4-20250514';
  
  const requestBody = {
    model: model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  };
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  return { text: data.content[0]?.text || '' };
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════

function buildSystemPrompt({ intent, devices, symptoms, rewards, pricing, imeiData, role }) {
  const basePrompt = `You are Fixology AI, the official diagnostic assistant for Fixology (fixologyai.com).

IDENTITY:
- You are built by certified repair technicians with real-world repair experience.
- You represent Fixology's diagnostic intelligence engine.
- You are NOT ChatGPT, GPT, OpenAI, Claude, or Anthropic. You are Fixology AI.
- Never say "as an AI language model" or reference your underlying technology.

CAPABILITIES:
- Device diagnostics for phones, tablets, laptops, gaming consoles, smartwatches, and earbuds
- IMEI/serial number checks for device status, blacklist, Find My, carrier lock
- Pricing and plan information for Fixology's services
- Repair guidance and troubleshooting

TONE & STYLE:
- Be confident, clear, and professional
- Give direct answers without unnecessary hedging
- Use short paragraphs and bullet points for readability
- No emojis in responses
- Don't be overly verbose - get to the point

FIXOLOGY PLATFORM INFO:
- Customer plan: FREE - unlimited AI diagnostics, price estimates, safety warnings
- Shop Pro plan: $149/month - POS, invoicing, inventory, CRM, SMS auto-replies, website chatbot
- Enterprise: Custom pricing - multi-location, API access, insurance claims integration
- Fixology Rewards: Earn Fix Points on repairs (10 FP per $1), redeem for discounts

ROLE CONTEXT: ${role === 'shop' ? 'User is a repair shop technician/owner using the Fixology dashboard.' : 'User is a customer seeking help with their device.'}`;

  let contextSection = '\n\nDATA CONTEXT:';
  
  // Add relevant device info summary
  if (devices) {
    const totalModels = devices.total_models || 347;
    const categories = devices.categories?.map(c => c.name).join(', ') || 'Phones, Tablets, Laptops, Desktops, Consoles, Wearables';
    contextSection += `\n- Supported devices: ${totalModels}+ models across ${categories}`;
  }
  
  // Add symptoms summary for diagnosis intent
  if (intent === 'diagnosis' && symptoms) {
    const categories = symptoms.categories?.map(c => `${c.name} (${c.symptoms?.length || 0} symptoms)`).join(', ');
    contextSection += `\n- Diagnostic database: ${symptoms.total_symptoms || 547} symptoms across categories: ${categories}`;
    contextSection += `\n- Full symptoms data available for detailed diagnostics`;
  }
  
  // Add pricing details for pricing intent
  if (intent === 'pricing' && pricing) {
    contextSection += `\n- IMEI Plans: Basic ($29/mo, 100 credits), Pro ($79/mo, 400 credits), Enterprise ($199/mo, unlimited)`;
    contextSection += `\n- Credit packs available: 50 for $15, 100 for $25, 250 for $50`;
  }
  
  // Add rewards summary
  if (rewards) {
    contextSection += `\n- Rewards tiers: Bronze (1x), Silver (1.25x at 2,500 FP), Gold (1.5x at 7,500 FP), Platinum (2x at 20,000 FP)`;
  }
  
  // Add IMEI data if present
  if (imeiData && imeiData.success) {
    contextSection += `\n\n[IMEI CHECK RESULTS]\n${JSON.stringify(imeiData, null, 2)}`;
  }

  let intentGuidelines = '\n\nRESPONSE GUIDELINES:';
  
  switch (intent) {
    case 'imei_check':
      intentGuidelines += `
- If IMEI data is provided, summarize it in clean bullet points
- Highlight critical issues: blacklist status, Find My, MDM lock, Lost Mode
- Provide a clear recommendation: SAFE TO PURCHASE, CAUTION, or DO NOT BUY
- If no IMEI provided, ask for the 15-digit IMEI number
- Explain how to find IMEI: dial *#06# or check Settings > General > About`;
      break;
      
    case 'diagnosis':
      intentGuidelines += `
- Ask 1-2 clarifying questions maximum to narrow down the issue
- Map symptoms to likely causes based on our diagnostic database
- Suggest specific diagnostic tests the user can perform
- Provide estimated repair difficulty and rough price range if applicable
- Flag any safety concerns (swollen battery, water damage, etc.)
- For shops: Include technical repair notes`;
      break;
      
    case 'pricing':
      intentGuidelines += `
- Provide clear pricing information based on user's needs
- For customers: Emphasize the FREE diagnostic tier
- For shops: Explain Shop Pro ($149/mo) vs Enterprise
- Mention IMEI credit pricing if relevant
- Note the free trial for early access shops`;
      break;
      
    default:
      intentGuidelines += `
- Answer questions about Fixology's services and capabilities
- Guide users to the right feature for their needs
- For general device questions, offer to help diagnose if they have an issue`;
  }
  
  return basePrompt + contextSection + intentGuidelines;
}

// ═══════════════════════════════════════════════════════════════════
// SUGGESTED ACTIONS GENERATOR
// ═══════════════════════════════════════════════════════════════════

function generateSuggestedActions(intent, imeiData) {
  const actions = [];
  
  switch (intent) {
    case 'imei_check':
      if (imeiData?.success) {
        if (imeiData.analysis?.overallStatus === 'flagged') {
          actions.push('Contact seller about device status');
          actions.push('Request proof of purchase');
        } else if (imeiData.analysis?.overallStatus === 'warning') {
          actions.push('Ask seller about Find My status');
          actions.push('Verify device ownership');
        } else {
          actions.push('Proceed with purchase');
          actions.push('Run full diagnostic check');
        }
      } else {
        actions.push('Enter IMEI to check device');
        actions.push('Dial *#06# to find IMEI');
      }
      break;
      
    case 'diagnosis':
      actions.push('Describe your device issue');
      actions.push('Check device warranty status');
      actions.push('Find a Fixology partner shop');
      break;
      
    case 'pricing':
      actions.push('Start free trial');
      actions.push('Compare all plans');
      actions.push('Contact sales for Enterprise');
      break;
      
    default:
      actions.push('Diagnose a device');
      actions.push('Check an IMEI');
      actions.push('View pricing plans');
  }
  
  return actions;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer || '';
  setCorsHeaders(res, origin);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      debug: `Received ${req.method}`
    });
  }
  
  try {
    const body = req.body || {};
    const { sessionId, role = 'customer', messages } = body;
    
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid messages array',
        debug: 'Request body must include messages: [{ role, content }, ...]'
      });
    }
    
    // Get the last user message for intent detection
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return res.status(400).json({
        success: false,
        error: 'No user message found',
        debug: 'At least one message must have role: "user"'
      });
    }
    
    // Detect intent
    const intent = detectIntent(lastUserMessage.content);
    
    // Load relevant data
    const [devices, symptoms, rewards, pricing] = await Promise.all([
      loadDevices(),
      loadSymptoms(),
      loadRewards(),
      loadPricing()
    ]);
    
    // Handle IMEI check if applicable
    let imeiData = null;
    if (intent === 'imei_check') {
      const imeiCandidate = extractIMEI(lastUserMessage.content);
      if (imeiCandidate) {
        imeiData = await checkIMEI(imeiCandidate);
      }
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      intent,
      devices,
      symptoms,
      rewards,
      pricing,
      imeiData,
      role
    });
    
    // Build context for LLM
    const context = {};
    if (intent === 'diagnosis' && symptoms) {
      context.symptomCategories = symptoms.categories?.map(c => ({
        name: c.name,
        symptoms: c.symptoms?.slice(0, 5).map(s => s.name)
      }));
    }
    if (intent === 'pricing' && pricing) {
      context.pricing = pricing;
    }
    if (imeiData) {
      context.imeiResult = imeiData;
    }
    
    // Call LLM
    const llmResponse = await callLLM({
      systemPrompt,
      messages,
      context: Object.keys(context).length > 0 ? context : null
    });
    
    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(intent, imeiData);
    
    // Build response
    const response = {
      success: true,
      intent,
      reply: llmResponse.text,
      meta: {
        suggestedActions
      }
    };
    
    // Add IMEI data to meta if present
    if (imeiData) {
      response.meta.imei = {
        checked: true,
        status: imeiData.success ? imeiData.analysis?.overallStatus : 'error',
        summary: imeiData.success ? imeiData.summary : null,
        analysis: imeiData.success ? imeiData.analysis : null
      };
    }
    
    return res.status(200).json(response);
    
  } catch (err) {
    console.error('Fixology Chat Error:', err);
    
    return res.status(500).json({
      success: false,
      error: 'Something went wrong processing your request. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


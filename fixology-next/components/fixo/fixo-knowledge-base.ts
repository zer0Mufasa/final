'use client'

// ============================================
// FIXO AI ASSISTANT - KNOWLEDGE BASE
// Comprehensive Fixology platform knowledge (UI-only)
// ============================================

export interface KnowledgeArticle {
  id: string
  category: string
  title: string
  keywords: string[]
  content: string
  relatedTopics?: string[]
}

export const FIXOLOGY_KNOWLEDGE: KnowledgeArticle[] = [
  // ==========================================
  // GETTING STARTED
  // ==========================================
  {
    id: 'getting-started-overview',
    category: 'Getting Started',
    title: 'Welcome to Fixology',
    keywords: ['start', 'begin', 'new', 'setup', 'first', 'welcome', 'intro', 'introduction', 'what is fixology', 'about'],
    content: `Welcome to Fixology! Fixology is an all-in-one repair shop management platform designed specifically for cell phone and electronics repair businesses.

**What Fixology does:**
• **Ticket Management** - Track repairs from intake to pickup with smart status updates
• **Customer Database** - Store customer info, repair history, and communication preferences
• **Inventory Control** - Manage parts, track stock levels, and automate reordering
• **Payments & Invoicing** - Process payments, generate invoices, and track revenue
• **AI Diagnostics** - Use AI to diagnose device issues and suggest repairs
• **Team Management** - Assign techs, track time, and manage permissions
• **Analytics & Insights** - Understand your business with real-time dashboards

**Quick Start Steps:**
1. Complete your shop profile in Settings
2. Add your first customer
3. Create a repair ticket
4. Set up your inventory
5. Configure payment methods

Need help with any of these? Just ask!`,
    relatedTopics: ['shop-setup', 'first-ticket', 'import-customers'],
  },
  {
    id: 'shop-setup',
    category: 'Getting Started',
    title: 'Setting Up Your Shop',
    keywords: ['shop', 'store', 'profile', 'business', 'configure', 'settings', 'name', 'address', 'logo'],
    content: `Let’s get your shop set up! Go to **Settings → Shop Profile** to configure:

**Basic Information:**
• Shop name and logo
• Business address
• Phone number and email
• Business hours
• Time zone

**Branding:**
• Upload your logo (recommended: 200x200px PNG)
• Set brand colors for receipts and invoices
• Customize your customer-facing portal

**Tax Settings:**
• Tax rate for your location
• Tax-inclusive or tax-exclusive pricing
• Multiple tax rates for different categories

**Receipt & Invoice Customization:**
• Add terms and conditions
• Include warranty information
• Custom footer message

**Pro Tip:** Complete your shop profile before creating tickets so receipts/invoices look professional from day one.`,
    relatedTopics: ['getting-started-overview', 'settings-overview', 'invoices'],
  },
  {
    id: 'first-ticket',
    category: 'Getting Started',
    title: 'Creating Your First Ticket',
    keywords: ['first', 'ticket', 'create', 'new', 'repair', 'order', 'work order'],
    content: `Creating a repair ticket is easy!

**Method 1: Quick Intake (Recommended)**
1. Click the **+ New Ticket** button on the dashboard
2. Use AI Quick Intake — describe the repair in plain English
3. Example: "iPhone 14 Pro cracked screen, customer wants same-day repair"
4. Fixology auto-fills customer, device, issue, and pricing (UI-only in demo)

**Method 2: Manual Entry**
1. Go to **Tickets → New Ticket**
2. Search or add a customer
3. Select or add the device
4. Describe the issue and symptoms
5. Add diagnostic notes
6. Set pricing and collect deposit
7. Print intake form for signature

**Ticket Stages:**
• Intake → Diagnosed → Waiting Parts → In Repair → Ready → Picked Up

**Pro Tip:** Use Quick Intake — it’s faster and helps catch missing information.`,
    relatedTopics: ['ticket-stages', 'quick-intake', 'customers-overview'],
  },
  {
    id: 'import-customers',
    category: 'Getting Started',
    title: 'Importing Existing Customers',
    keywords: ['import', 'csv', 'customers', 'migrate', 'transfer', 'repairshopr', 'repairdesk', 'existing'],
    content: `Import your customer list from another system.

**How to Import:**
1. Go to **Customers → Import**
2. Choose your source format
3. Upload a CSV/XLSX
4. Map columns to Fixology fields
5. Preview and import

**Pro Tip:** Run a test import with 10–20 customers first to verify mapping.`,
    relatedTopics: ['customers-overview', 'customer-add', 'data-export'],
  },

  // ==========================================
  // TICKETS & REPAIRS
  // ==========================================
  {
    id: 'tickets-overview',
    category: 'Tickets',
    title: 'Understanding Tickets',
    keywords: ['ticket', 'tickets', 'repair', 'repairs', 'work order', 'overview', 'what is'],
    content: `Tickets are the heart of Fixology.

**What’s in a Ticket:**
• Customer info
• Device details (make/model/IMEI/serial)
• Issue description and symptoms
• Diagnostic notes
• Repair tasks and parts used
• Pricing and payments
• Status and timeline
• Tech assignment
• Communication history`,
    relatedTopics: ['ticket-stages', 'ticket-search', 'customer-communication'],
  },
  {
    id: 'ticket-stages',
    category: 'Tickets',
    title: 'Ticket Stages Explained',
    keywords: ['stage', 'stages', 'status', 'workflow', 'intake', 'diagnosed', 'repair', 'ready', 'picked up', 'waiting parts'],
    content: `Fixology uses 6 standard stages to track progress:

**1. Intake** — Device received; initial inspection pending
**2. Diagnosed** — Issue identified; awaiting approval
**3. Waiting Parts** — Parts ordered; waiting for delivery
**4. In Repair** — Technician actively working
**5. Ready** — Repair complete; awaiting pickup
**6. Picked Up** — Customer collected device; ticket closed

You can add custom stages in **Settings → Workflow** (UI-only in demo).`,
    relatedTopics: ['tickets-overview', 'workflow-custom'],
  },
  {
    id: 'quick-intake',
    category: 'Tickets',
    title: 'AI Quick Intake',
    keywords: ['quick', 'intake', 'ai', 'fast', 'auto', 'automatic', 'smart'],
    content: `Quick Intake uses AI to create tickets in seconds from natural language.

**How It Works:**
1. Click the Quick Intake box on the dashboard
2. Type repair details naturally
3. Fixology extracts: customer, device, issue, and price (UI-only in demo)
4. Review and submit`,
    relatedTopics: ['first-ticket', 'ai-features'],
  },
  {
    id: 'ticket-search',
    category: 'Tickets',
    title: 'Finding Tickets',
    keywords: ['search', 'find', 'filter', 'lookup', 'ticket number', 'customer name', 'imei'],
    content: `Find any ticket quickly using search and filters.

**Quick Search:**
• Ticket number: "FIX-1234"
• Customer: "John Smith"
• Phone: "512-555-0123"
• Device: "iPhone 14 Pro"
• IMEI: partial or full match

**Advanced Filters:**
• Stage, Tech, Date Range, Priority, Risk, Payment status

**Pro Tip:** Use short, specific terms (e.g., last 4 digits of phone, or partial device name).`,
    relatedTopics: ['tickets-overview', 'saved-views'],
  },

  // ==========================================
  // CUSTOMERS
  // ==========================================
  {
    id: 'customers-overview',
    category: 'Customers',
    title: 'Customer Management',
    keywords: ['customer', 'customers', 'client', 'manage', 'database', 'crm'],
    content: `Customer profiles include:
• Contact info
• Devices
• Repair history
• Payment history
• Communication preferences
• Notes/tags`,
    relatedTopics: ['customer-add', 'customer-communication'],
  },
  {
    id: 'customer-add',
    category: 'Customers',
    title: 'Adding Customers',
    keywords: ['add', 'new', 'create', 'customer', 'register'],
    content: `Add customers during ticket intake or from Customers → Add Customer.

**Pro Tip:** Phone number is the best unique identifier. Email enables digital receipts.`,
    relatedTopics: ['customers-overview', 'import-customers'],
  },
  {
    id: 'customer-communication',
    category: 'Customers',
    title: 'Customer Communication',
    keywords: ['sms', 'text', 'email', 'notify', 'notification', 'message', 'communicate', 'contact'],
    content: `Keep customers informed automatically or manually.

**Automatic notifications** (configurable):
• Ticket created
• Diagnosis ready
• Repair started
• Ready for pickup

**Manual messages:**
Open any ticket → Send Message (UI-only in demo).`,
    relatedTopics: ['notifications', 'templates'],
  },

  // ==========================================
  // INVENTORY
  // ==========================================
  {
    id: 'inventory-overview',
    category: 'Inventory',
    title: 'Inventory Management',
    keywords: ['inventory', 'stock', 'parts', 'supplies', 'manage', 'sku'],
    content: `Track parts by SKU, location, cost, and stock level.

Key features:
• Low stock alerts
• Supplier tracking
• Cost/margin tracking
• Barcode scanning (future UI)`,
    relatedTopics: ['inventory-add', 'inventory-reorder'],
  },
  {
    id: 'inventory-add',
    category: 'Inventory',
    title: 'Adding Inventory',
    keywords: ['add', 'new', 'part', 'receive', 'stock'],
    content: `Add parts via Inventory → Add Part, or import via CSV.

Recommended fields:
• Name, SKU, Category, Cost, Sell Price, Quantity, Location.`,
    relatedTopics: ['inventory-overview'],
  },
  {
    id: 'inventory-reorder',
    category: 'Inventory',
    title: 'Reordering Parts',
    keywords: ['reorder', 'order', 'purchase', 'low stock', 'supplier'],
    content: `Set minimum quantities and reorder points for key parts. Review reorder suggestions weekly.`,
    relatedTopics: ['inventory-overview'],
  },

  // ==========================================
  // PAYMENTS
  // ==========================================
  {
    id: 'payments-overview',
    category: 'Payments',
    title: 'Payments & Invoicing',
    keywords: ['payment', 'payments', 'invoice', 'billing', 'charge', 'money', 'deposit'],
    content: `Fixology supports multiple payment methods (UI-first):
• Cash, Card, Mobile payments, Bank transfer, Store credit

Workflows:
• Deposits
• Split payments
• Refunds
• End-of-day summary`,
    relatedTopics: ['payment-setup', 'invoices'],
  },
  {
    id: 'payment-setup',
    category: 'Payments',
    title: 'Setting Up Payments',
    keywords: ['setup', 'connect', 'stripe', 'square', 'terminal', 'card reader'],
    content: `Connect Stripe/Square in Settings → Payments (functionality wired later; UI-only in demo).`,
    relatedTopics: ['payments-overview'],
  },
  {
    id: 'invoices',
    category: 'Payments',
    title: 'Creating Invoices',
    keywords: ['invoice', 'receipt', 'send', 'email', 'sms'],
    content: `Invoices can be generated automatically when a ticket is Ready, or manually from the ticket (UI-only in demo).`,
    relatedTopics: ['payments-overview'],
  },

  // ==========================================
  // DIAGNOSTICS
  // ==========================================
  {
    id: 'diagnostics-overview',
    category: 'Diagnostics',
    title: 'Device Diagnostics',
    keywords: ['diagnostic', 'diagnostics', 'test', 'check', 'diagnose', 'panic log'],
    content: `Use diagnostics to identify issues quickly:
• Symptom checker
• Panic log analysis (iPhone)
• Battery health checks
• IMEI/serial lookup`,
    relatedTopics: ['panic-logs'],
  },
  {
    id: 'panic-logs',
    category: 'Diagnostics',
    title: 'Panic Log Analysis',
    keywords: ['panic', 'log', 'crash', 'kernel', 'iphone', 'analysis'],
    content: `Paste panic logs into Fixology’s analyzer for:
• Plain-English explanation
• Likely failing component
• Repair recommendations`,
    relatedTopics: ['diagnostics-overview'],
  },

  // ==========================================
  // AI FEATURES
  // ==========================================
  {
    id: 'ai-features',
    category: 'AI Features',
    title: 'AI-Powered Features',
    keywords: ['ai', 'smart', 'automatic', 'fixo', 'assistant', 'quick intake'],
    content: `AI features include:
• Fixo assistant
• Quick Intake
• Smart diagnostics
• Predictive insights (future)`,
    relatedTopics: ['quick-intake'],
  },

  // ==========================================
  // TEAM
  // ==========================================
  {
    id: 'team-overview',
    category: 'Team',
    title: 'Team Management',
    keywords: ['team', 'staff', 'technician', 'front desk', 'roles', 'permissions'],
    content: `Roles help keep the shop safe and fast:
• Owner, Manager, Technician, Front Desk

Set roles in Settings → Team (UI-only in demo).`,
    relatedTopics: ['time-tracking'],
  },
  {
    id: 'time-tracking',
    category: 'Team',
    title: 'Time Tracking',
    keywords: ['time', 'clock', 'hours', 'tracking', 'shift'],
    content: `Time tracking supports:
• Clock in/out
• Per-ticket timers
• Timesheets and exports (UI-first)`,
    relatedTopics: ['team-overview'],
  },

  // ==========================================
  // SETTINGS / TROUBLESHOOTING / BILLING / WARRANTY
  // ==========================================
  {
    id: 'settings-overview',
    category: 'Settings',
    title: 'Settings Overview',
    keywords: ['settings', 'configure', 'preferences', 'workflow', 'notifications'],
    content: `Settings areas:
• Shop profile
• Payments
• Invoices/receipts
• Notifications
• Team/roles
• Workflow`,
    relatedTopics: ['notifications'],
  },
  {
    id: 'notifications',
    category: 'Settings',
    title: 'Notification Settings',
    keywords: ['notifications', 'sms', 'email', 'templates', 'triggers'],
    content: `Configure automatic triggers and templates in Settings → Notifications (UI-only in demo).`,
    relatedTopics: ['customer-communication'],
  },
  {
    id: 'troubleshooting',
    category: 'Troubleshooting',
    title: 'Common Issues',
    keywords: ['help', 'problem', 'issue', 'error', 'not working', 'troubleshoot'],
    content: `Common fixes:
• Hard refresh
• Check connections (payments/SMS)
• Verify filters and date ranges

If stuck, open Fixo and describe what you’re seeing.`,
  },
  {
    id: 'pricing-plans',
    category: 'Billing',
    title: 'Fixology Pricing',
    keywords: ['price', 'pricing', 'plan', 'cost', 'subscription', 'billing'],
    content: `Fixology plans vary by shop size. Ask your admin for your current plan, or check Settings → Billing.`,
  },
  {
    id: 'warranty',
    category: 'Warranty',
    title: 'Warranty Management',
    keywords: ['warranty', 'return', 'refund', 'exchange', 'claim'],
    content: `Track warranty periods and claims per ticket. Document before/after photos to reduce disputes.`,
  },
]

export function searchKnowledge(query: string): KnowledgeArticle[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const words = q.split(/\s+/).filter(Boolean)

  const scored = FIXOLOGY_KNOWLEDGE.map((article) => {
    let score = 0

    for (const keyword of article.keywords) {
      const kw = keyword.toLowerCase()
      if (q.includes(kw)) score += 10
      for (const w of words) {
        if (kw.includes(w)) score += 5
      }
    }

    const title = article.title.toLowerCase()
    if (title.includes(q)) score += 8
    for (const w of words) {
      if (title.includes(w)) score += 3
    }

    const content = article.content.toLowerCase()
    for (const w of words) {
      if (content.includes(w)) score += 1
    }

    return { article, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.article)
}


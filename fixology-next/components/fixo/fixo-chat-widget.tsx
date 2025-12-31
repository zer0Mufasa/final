'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Trash2,
} from 'lucide-react'

// ============================================
// FIXO AI ASSISTANT - CHAT WIDGET v2
// Completely rewritten with proper logic
// ============================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// KNOWLEDGE BASE
// ============================================

interface Article {
  id: string
  title: string
  triggers: string[]
  keywords: string[]
  content: string
}

const KNOWLEDGE_BASE: Article[] = [
  {
    id: 'create-ticket',
    title: 'Creating a Ticket',
    triggers: ['create ticket', 'create a ticket', 'new ticket', 'make ticket', 'add ticket', 'how to create ticket', 'how do i create a ticket', 'start ticket', 'open ticket', 'make a ticket', 'creating ticket'],
    keywords: ['create', 'ticket', 'new', 'make', 'add'],
    content: `**Creating a ticket in Fixology is easy!**

**Quick Method (Recommended):**
1. Click **+ New Ticket** on the dashboard
2. Type the repair details naturally, like:
   *"iPhone 14 Pro cracked screen for John Smith, $219"*
3. Fixo AI auto-fills customer, device, issue, and price
4. Review and submit

**Manual Method:**
1. Go to **Tickets → New Ticket**
2. Search or add a customer
3. Select the device
4. Describe the issue
5. Set pricing and collect deposit
6. Save and print intake form

**Pro tip:** The AI Quick Intake is 3x faster and catches missing info automatically!`
  },
  {
    id: 'ticket-stages',
    title: 'Ticket Stages',
    triggers: ['ticket stages', 'ticket status', 'repair stages', 'workflow stages', 'what are stages', 'stage meaning', 'status meaning', 'stages'],
    keywords: ['stages', 'status', 'workflow', 'intake', 'diagnosed', 'repair', 'ready', 'picked'],
    content: `**Fixology uses 6 stages to track repairs:**

📥 **Intake** — Device received, waiting for diagnosis
🔍 **Diagnosed** — Issue found, waiting for customer approval
⏳ **Waiting Parts** — Parts on order
🔧 **In Repair** — Tech actively working
✅ **Ready** — Complete, waiting for pickup
🏁 **Picked Up** — Customer collected, ticket closed

Tickets move through stages automatically based on actions, or you can change them manually.

You can add custom stages in **Settings → Workflow**.`
  },
  {
    id: 'quick-intake',
    title: 'Quick Intake',
    triggers: ['quick intake', 'ai intake', 'fast intake', 'smart intake', 'natural language intake'],
    keywords: ['quick', 'intake', 'fast', 'natural', 'language'],
    content: `**Quick Intake uses AI to create tickets from plain English.**

Just type something like:
• *"iPhone 14 screen repair for John, $199"*
• *"Samsung S23 battery replacement, walk-in customer"*
• *"iPad not charging, Maria Garcia, rush job"*

**Fixo AI automatically detects:**
• Customer name (matches existing or creates new)
• Device make and model
• Issue type
• Price if mentioned
• Priority/urgency

It's on the dashboard — look for the ✨ Quick Intake card!`
  },
  {
    id: 'customers',
    title: 'Customer Management',
    triggers: ['manage customers', 'customer management', 'add customer', 'new customer', 'customer database', 'find customer', 'customers'],
    keywords: ['customer', 'customers', 'client', 'clients'],
    content: `**Managing customers in Fixology:**

**Adding a Customer:**
• During ticket creation, just type their name
• Or go to **Customers → Add Customer**
• Minimum required: Name and phone number

**Customer Profiles Include:**
• Contact info and address
• All their devices
• Complete repair history
• Payment history
• Communication log
• Notes and tags

**Finding Customers:**
Use the search bar (⌘K) — search by name, phone, or email.

**Importing Customers:**
Go to **Customers → Import** to upload from CSV or migrate from other systems.`
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    triggers: ['inventory', 'parts', 'stock', 'manage inventory', 'add parts', 'low stock', 'parts management'],
    keywords: ['inventory', 'parts', 'stock', 'supplies', 'order'],
    content: `**Managing inventory in Fixology:**

**Adding Parts:**
1. Go to **Inventory → Add Part**
2. Enter name, SKU, cost, sell price
3. Set minimum stock level for alerts

**Key Features:**
• Track by SKU, location, and condition
• Low stock alerts
• Automatic reorder suggestions
• Supplier management
• Barcode scanning

**When you use a part on a ticket:**
Stock automatically decreases. If it's not in inventory, you can add it on the fly.

**Reordering:**
Go to **Inventory → Reorder** to see what's running low and create purchase orders.`
  },
  {
    id: 'payments',
    title: 'Payments',
    triggers: ['payment', 'payments', 'pay', 'charge', 'accept payment', 'credit card', 'process payment', 'take payment'],
    keywords: ['payment', 'pay', 'charge', 'card', 'cash', 'money'],
    content: `**Processing payments in Fixology:**

**Supported Methods:**
• 💵 Cash
• 💳 Credit/Debit (Stripe or Square)
• 📱 Apple Pay, Google Pay
• 🔗 Pay-by-Link (send invoice, customer pays online)

**Taking Payment:**
1. Open the ticket
2. Click **Take Payment**
3. Select payment method
4. Enter amount (or full balance)
5. Complete transaction

**Setup:**
Connect Stripe or Square in **Settings → Payments**.

**Deposits:**
Collect upfront at intake — set a fixed amount or percentage.`
  },
  {
    id: 'invoices',
    title: 'Invoices',
    triggers: ['invoice', 'invoices', 'billing', 'receipt', 'send invoice', 'create invoice'],
    keywords: ['invoice', 'bill', 'receipt', 'billing'],
    content: `**Invoices in Fixology:**

**Auto-Generated:**
Invoices create automatically when a ticket moves to "Ready" status.

**Manual Invoice:**
1. Open ticket → **Create Invoice**
2. Review line items
3. Add discounts if needed
4. Save or Send

**Sending Options:**
• **Email** — PDF attachment with payment link
• **SMS** — Short link to online invoice
• **Print** — For in-store

**Customize:**
Edit your invoice template in **Settings → Invoice Template**.`
  },
  {
    id: 'notifications',
    title: 'Notifications',
    triggers: ['notification', 'notifications', 'sms', 'text message', 'email customer', 'auto notify', 'send text', 'text customer'],
    keywords: ['notification', 'notify', 'sms', 'text', 'email', 'alert', 'message'],
    content: `**Customer notifications in Fixology:**

**Automatic Updates (configurable):**
• ✅ Ticket created
• 🔍 Diagnosis complete
• ⏳ Parts ordered/arrived
• 🔧 Repair started
• ✅ Ready for pickup
• ⏰ Pickup reminder

**Sending Manual Messages:**
Open any ticket → **Send Message** → Choose SMS or Email

**Customize Templates:**
Go to **Settings → Notifications** to edit message templates.

**Variables you can use:**
• {{customer_name}}
• {{device}}
• {{ticket_id}}
• {{total}}`
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
    triggers: ['diagnostic', 'diagnostics', 'diagnose', 'test device', 'check device', 'panic log', 'panic logs', 'device test'],
    keywords: ['diagnostic', 'diagnose', 'test', 'check', 'panic', 'log'],
    content: `**Device diagnostics in Fixology:**

**Symptom Checker:**
Enter symptoms → get likely causes and repair suggestions

**Panic Log Analyzer (iPhone):**
1. Extract panic logs from device
2. Paste into Fixology
3. AI identifies failing components

**Common Panic Codes:**
• PMU → Power management issue
• Baseband → Cellular modem
• NAND → Storage problem
• MESA → Display/touch controller

**Diagnostic Checklist:**
For each repair type, run standard tests:
• Screen: Touch, display, True Tone
• Battery: Capacity, charging
• Cameras, speakers, sensors

Document everything with photos!`
  },
  {
    id: 'team',
    title: 'Team Management',
    triggers: ['team', 'staff', 'employee', 'add user', 'technician', 'permissions', 'roles', 'add team member'],
    keywords: ['team', 'staff', 'employee', 'tech', 'user', 'role', 'permission'],
    content: `**Managing your team in Fixology:**

**Adding Team Members:**
1. Go to **Settings → Team**
2. Click **Invite Member**
3. Enter email and select role
4. Send invite

**Roles:**
• **Owner** — Full access
• **Manager** — Operations + reports, no billing
• **Technician** — Tickets and inventory only
• **Front Desk** — Tickets and payments, no tech ops

**Time Tracking:**
Team members can clock in/out from the dashboard. Track hours per ticket too.

**Activity Log:**
See who did what and when — all actions are logged.`
  },
  {
    id: 'settings',
    title: 'Settings',
    triggers: ['settings', 'configure', 'setup', 'preferences', 'shop settings', 'configuration'],
    keywords: ['settings', 'configure', 'setup', 'preference', 'option'],
    content: `**Fixology Settings:**

**Shop Profile** — Name, logo, address, hours
**Payments** — Connect Stripe/Square
**Invoices** — Template customization
**Notifications** — SMS/Email templates
**Team** — Users and permissions
**Workflow** — Custom ticket stages
**Pricing** — Default prices, markup rules
**Inventory** — Low stock alerts
**Integrations** — Third-party connections

Access via the ⚙️ **Settings** link in the sidebar.

**Pro tip:** Complete your shop profile first — it appears on all customer-facing documents!`
  },
  {
    id: 'pricing-plans',
    title: 'Pricing',
    triggers: ['pricing', 'price', 'cost', 'how much', 'subscription', 'plan', 'plans', 'free trial', 'monthly cost'],
    keywords: ['price', 'cost', 'plan', 'subscription', 'trial', 'free', 'monthly'],
    content: `**Fixology Pricing:**

🆓 **Free Trial** — 14 days, all features

💼 **Starter** — $49/month
• 1 location, 2 users, 100 tickets/month

🚀 **Pro** — $99/month
• 1 location, 5 users, unlimited tickets
• Advanced analytics, API access

🏢 **Business** — $199/month
• Up to 3 locations, 15 users
• Priority support, custom integrations

💰 **Save 20%** with annual billing!

Start your free trial at fixology.io`
  },
  {
    id: 'integrations',
    title: 'Integrations',
    triggers: ['integration', 'integrations', 'connect', 'sync', 'api', 'zapier', 'quickbooks', 'third party'],
    keywords: ['integration', 'connect', 'sync', 'api', 'zapier', 'quickbooks'],
    content: `**Fixology Integrations:**

**Built-in:**
• Stripe & Square (payments)
• Twilio (SMS)
• QuickBooks & Xero (accounting)
• Google Calendar

**Zapier:**
Connect to 1000+ apps — no code needed:
• New ticket → Slack notification
• Payment → Update spreadsheet

**API:**
Full REST API for custom integrations.
Docs at docs.fixology.io/api

Setup integrations in **Settings → Integrations**.`
  },
  {
    id: 'warranty',
    title: 'Warranty',
    triggers: ['warranty', 'return', 'refund', 'guarantee', 'warranty claim', 'returns'],
    keywords: ['warranty', 'return', 'refund', 'guarantee', 'claim'],
    content: `**Warranty management in Fixology:**

**Setting Warranty Periods:**
Go to **Settings → Warranty** to set defaults:
• Screens: 90 days
• Batteries: 180 days
• Other repairs: 60 days

**Tracking:**
Each completed ticket shows warranty status and expiration date.

**Processing Claims:**
1. Find original ticket
2. Click **Warranty Claim**
3. Document the issue
4. Choose: re-repair, replacement, or refund

**Pro tip:** Take before/after photos on every repair — essential for dispute resolution!`
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    triggers: ['problem', 'issue', 'not working', 'error', 'broken', 'fix', 'troubleshoot', 'bug'],
    keywords: ['problem', 'issue', 'error', 'broken', 'fix', 'troubleshoot', 'bug'],
    content: `**Common issues and fixes:**

**App not loading:**
• Clear browser cache (Cmd+Shift+R)
• Try incognito mode
• Check internet connection

**Payments not working:**
• Verify Stripe/Square connection
• Check card reader is paired
• Try manual card entry

**SMS not sending:**
• Check Twilio connection
• Verify phone number format (+1...)
• Check Twilio balance

**Reports showing wrong data:**
• Verify date range filters
• Make sure tickets are properly closed
• Clear and regenerate report

**Still stuck?** File a support ticket or email support@fixology.io`
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    triggers: ['reports', 'analytics', 'dashboard', 'metrics', 'data', 'insights', 'statistics'],
    keywords: ['report', 'analytics', 'dashboard', 'metric', 'data', 'insight'],
    content: `**Reports & Analytics in Fixology:**

**Dashboard Metrics:**
• Revenue (today, week, month)
• Tickets completed
• Average repair time
• Customer satisfaction

**Available Reports:**
• 💰 Revenue by day/week/month
• 🎫 Tickets by status
• 📦 Inventory levels
• 👥 Customer stats
• 👨‍🔧 Tech performance

**Scheduling:**
Set up automatic email reports — daily or weekly summaries.

**Custom Reports:**
Build your own with the metrics that matter to you.

Access reports from **📈 Insights** in the sidebar.`
  },
]

// ============================================
// RESPONSE GENERATOR
// ============================================

function generateResponse(input: string): string {
  const query = input.toLowerCase().trim()
  
  // ========== GREETINGS ==========
  const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'hiya', 'greetings', 'good morning', 'good afternoon', 'good evening', "what's up", 'whats up']
  
  for (const greeting of greetings) {
    if (query === greeting || query === greeting + '!' || query === greeting + '.' || query.startsWith(greeting + ' ')) {
      return `Hey there! 👋 I'm Fixo, your AI assistant for Fixology.

I can help you with:
• Creating and managing tickets
• Customer management
• Inventory and parts
• Payments and invoicing
• Diagnostics
• Team settings
• And much more!

What would you like to know about?`
    }
  }

  // ========== SHORT CONFUSED RESPONSES ==========
  const confused = ['huh', 'what', 'hm', 'hmm', '?', 'um', 'uh', 'eh', 'idk', 'wut']
  if (confused.includes(query)) {
    return `No worries! 😊 Here's what I can help with:

• **"How do I create a ticket?"**
• **"What are ticket stages?"**
• **"How do payments work?"**
• **"Tell me about inventory"**

Just ask any question about Fixology!`
  }

  // ========== THANKS ==========
  const thanks = ['thanks', 'thank you', 'thx', 'ty', 'appreciate it', 'appreciate', 'cheers', 'cool thanks', 'ok thanks']
  for (const t of thanks) {
    if (query === t || query.startsWith(t)) {
      return `You're welcome! 😊 

Let me know if you have any other questions about Fixology!`
    }
  }

  // ========== WHO ARE YOU ==========
  if (query.includes('who are you') || query.includes('what are you') || query.includes('about you') || query.includes('your name') || query.includes('are you a bot') || query.includes('are you ai')) {
    return `I'm **Fixo**, the AI assistant built into Fixology! 🤖

I can help you:
• Learn how to use any feature
• Troubleshoot issues
• Find the right settings
• Get tips and best practices

I know everything about Fixology, so just ask!`
  }

  // ========== HELP ==========
  if (query === 'help' || query === 'help me' || query.includes('what can you do') || query.includes('how can you help')) {
    return `I'm here to help! Here's what you can ask me:

**Getting Started:**
• "How do I create a ticket?"
• "How do I add a customer?"

**Daily Operations:**
• "What are the ticket stages?"
• "How do I process a payment?"
• "How do notifications work?"

**Features:**
• "How does inventory work?"
• "How do I set up integrations?"
• "What are the pricing plans?"

**Troubleshooting:**
• "Payments aren't working"
• "SMS isn't sending"

Just ask naturally — I'll find the answer! 🔍`
  }

  // ========== SEARCH KNOWLEDGE BASE ==========
  
  // Check for exact trigger phrases first
  for (const article of KNOWLEDGE_BASE) {
    for (const trigger of article.triggers) {
      if (query === trigger || query.includes(trigger)) {
        return article.content
      }
    }
  }

  // Keyword matching with scoring
  const words = query.split(/\s+/).filter(w => w.length > 2)
  let bestMatch: Article | null = null
  let bestScore = 0

  for (const article of KNOWLEDGE_BASE) {
    let score = 0
    
    for (const word of words) {
      // Check keywords
      for (const keyword of article.keywords) {
        if (word === keyword) {
          score += 5
        } else if (keyword.includes(word) || word.includes(keyword)) {
          score += 2
        }
      }
      
      // Check title
      if (article.title.toLowerCase().includes(word)) {
        score += 3
      }

      // Check triggers
      for (const trigger of article.triggers) {
        if (trigger.includes(word)) {
          score += 2
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = article
    }
  }

  // Return if we have a good match
  if (bestMatch && bestScore >= 4) {
    return bestMatch.content
  }

  // ========== FALLBACK ==========
  return `I'm not sure about that specific question. 🤔

Here are topics I can definitely help with:
• **Tickets** — "How do I create a ticket?"
• **Customers** — "How do customer profiles work?"
• **Payments** — "How do I take a payment?"
• **Inventory** — "How does inventory work?"
• **Settings** — "How do I configure Fixology?"

Try asking about one of these, or rephrase your question!

Need human help? Go to **Support → Contact Us**.`
}

// ============================================
// TYPES
// ============================================

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  feedback?: 'up' | 'down'
}

interface FixoContextType {
  isOpen: boolean
  isExpanded: boolean
  messages: Message[]
  isTyping: boolean
  openChat: () => void
  closeChat: () => void
  toggleExpanded: () => void
  sendMessage: (content: string) => void
  clearHistory: () => void
  setFeedback: (messageId: string, feedback: 'up' | 'down') => void
}

// ============================================
// CONTEXT
// ============================================

const FixoContext = createContext<FixoContextType | null>(null)

export function useFixo() {
  const context = useContext(FixoContext)
  if (!context) {
    throw new Error('useFixo must be used within a FixoProvider')
  }
  return context
}

// ============================================
// PROVIDER
// ============================================

export function FixoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fixo-chat-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (e) {
        console.error('Failed to load chat history')
      }
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fixo-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))

    const responseContent = generateResponse(content)

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsTyping(false)
  }, [])

  const clearHistory = useCallback(() => {
    setMessages([])
    localStorage.removeItem('fixo-chat-history')
  }, [])

  const setFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ))
  }, [])

  return (
    <FixoContext.Provider value={{
      isOpen,
      isExpanded,
      messages,
      isTyping,
      openChat,
      closeChat,
      toggleExpanded,
      sendMessage,
      clearHistory,
      setFeedback
    }}>
      {children}
    </FixoContext.Provider>
  )
}

// ============================================
// WIDGET
// ============================================

export function FixoWidget() {
  const { isOpen, openChat } = useFixo()

  return (
    <>
      {isOpen && <FixoChatPanel />}

      {!isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all flex items-center justify-center group"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#07070a]">
            <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </span>
        </button>
      )}
    </>
  )
}

// ============================================
// CHAT PANEL
// ============================================

function FixoChatPanel() {
  const { 
    isExpanded, 
    messages, 
    isTyping, 
    closeChat, 
    toggleExpanded, 
    sendMessage, 
    clearHistory,
    setFeedback 
  } = useFixo()
  
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input)
      setInput('')
    }
  }

  const suggestions = [
    "How do I create a ticket?",
    "What are the ticket stages?",
    "How do payments work?",
    "Tell me about inventory",
  ]

  return (
    <div 
      className={cn(
        "fixed z-50 bg-[#0a0a0e] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300",
        isExpanded 
          ? "bottom-6 right-6 left-6 top-6 md:left-auto md:w-[600px] md:top-6" 
          : "bottom-6 right-6 w-[380px] h-[560px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-violet-500/[0.08] to-fuchsia-500/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/95 flex items-center gap-2">
              Fixo
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">AI</span>
            </div>
            <div className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={clearHistory}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleExpanded}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={closeChat}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggest={sendMessage} suggestions={suggestions} />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onFeedback={setFeedback}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Fixo anything..."
            className="flex-1 h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
              input.trim()
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                : "bg-white/[0.04] text-white/30 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================
// WELCOME SCREEN
// ============================================

function WelcomeScreen({ onSuggest, suggestions }: { onSuggest: (q: string) => void; suggestions: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-lg font-semibold text-white/95 mb-2">
        Hey! I'm Fixo 👋
      </h2>
      <p className="text-sm text-white/60 mb-6 max-w-xs">
        Your AI assistant for Fixology. Ask me anything about managing your repair shop!
      </p>

      <div className="w-full space-y-2">
        <p className="text-xs text-white/40 mb-2">Try asking:</p>
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-sm text-white/70 hover:text-white/90"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// CHAT MESSAGE
// ============================================

function ChatMessage({ 
  message, 
  onFeedback 
}: { 
  message: Message
  onFeedback: (id: string, feedback: 'up' | 'down') => void 
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
        isUser 
          ? "bg-white/[0.08] text-white/70" 
          : "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"
      )}>
        {isUser ? (
          <span className="text-xs font-semibold">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        <div className={cn(
          "inline-block px-4 py-3 rounded-2xl text-sm max-w-[90%] text-left",
          isUser 
            ? "bg-violet-500/20 border border-violet-500/30 text-white/90" 
            : "bg-white/[0.04] border border-white/[0.08] text-white/85"
        )}>
          <FormattedContent content={message.content} />
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-2 pl-1">
            <span className="text-[10px] text-white/30">
              {formatTime(message.timestamp)}
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/50"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onFeedback(message.id, 'up')}
                className={cn(
                  "p-1 rounded hover:bg-white/[0.06] transition-colors",
                  message.feedback === 'up' ? "text-emerald-400" : "text-white/30 hover:text-white/50"
                )}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onFeedback(message.id, 'down')}
                className={cn(
                  "p-1 rounded hover:bg-white/[0.06] transition-colors",
                  message.feedback === 'down' ? "text-rose-400" : "text-white/30 hover:text-white/50"
                )}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {isUser && (
          <div className="text-[10px] text-white/30 mt-1 pr-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// FORMATTED CONTENT
// ============================================

function FormattedContent({ content }: { content: string }) {
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white/95">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-white/70">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/[0.08] text-violet-300 text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br />')

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: formatted }} 
      className="leading-relaxed"
    />
  )
}

// ============================================
// TYPING INDICATOR
// ============================================

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

// ============================================
// TRIGGER BUTTON
// ============================================

export function FixoTriggerButton({ 
  className,
  children 
}: { 
  className?: string
  children?: ReactNode 
}) {
  const { openChat } = useFixo()

  return (
    <button
      onClick={openChat}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all",
        className
      )}
    >
      <Sparkles className="w-4 h-4" />
      {children || "Ask Fixo"}
    </button>
  )
}

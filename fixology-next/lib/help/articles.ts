export type HelpTopic = {
  id: string
  title: string
  description: string
}

export type HelpArticle = {
  slug: string
  topicId: string
  title: string
  summary: string
  body: string
}

export const HELP_TOPICS: HelpTopic[] = [
  { id: 'getting-started', title: 'Getting Started', description: 'Setup guides and first steps' },
  { id: 'tickets', title: 'Tickets & Repairs', description: 'Manage your repair workflow end-to-end' },
  { id: 'inventory', title: 'Inventory', description: 'Stock, parts, and reorder suggestions' },
  { id: 'payments', title: 'Billing & Subscription', description: 'Plans, invoices, and Stripe billing' },
  { id: 'team', title: 'Team Management', description: 'Roles, permissions, and staff time tracking' },
  { id: 'integrations', title: 'Integrations', description: 'IMEI checks, AI diagnostics, and more' },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'getting-started-first-login',
    topicId: 'getting-started',
    title: 'First login & onboarding checklist',
    summary: 'Complete onboarding and verify your shop profile, hours, and team.',
    body: [
      'Welcome to Fixology.',
      '',
      'Recommended first steps:',
      '- Finish onboarding (shop address, hours, repair focus).',
      '- Add staff accounts and set roles (Owner/Manager/Technician/Front Desk).',
      '- Create your first customer and ticket to validate the workflow.',
      '',
      'If onboarding is incomplete, Fixology will redirect you to /onboarding automatically.',
    ].join('\n'),
  },
  {
    slug: 'tickets-workflow-statuses',
    topicId: 'tickets',
    title: 'Ticket workflow: statuses & best practices',
    summary: 'How ticket statuses map to the real repair lifecycle.',
    body: [
      'Fixology tickets move through a simple status pipeline:',
      '',
      '- INTAKE: customer/device checked in, issue recorded',
      '- DIAGNOSED: diagnosis completed, estimate ready',
      '- WAITING_PARTS: parts needed before continuing',
      '- IN_PROGRESS: repair underway',
      '- READY: repair finished, ready for pickup',
      '- PICKED_UP: delivered back to customer',
      '- CANCELLED: cancelled/closed',
      '',
      'Tip: use internal notes for technician details; use customer messages for approved updates.',
    ].join('\n'),
  },
  {
    slug: 'customer-notifications',
    topicId: 'tickets',
    title: 'Automated customer notifications (email/SMS)',
    summary: 'Send status updates to customers automatically or manually.',
    body: [
      'Fixology can send outbound messages when a ticket changes state.',
      '',
      'Email delivery uses Resend. To enable it:',
      '- Set RESEND_API_KEY',
      '- Set RESEND_FROM_EMAIL (or CONTACT_FROM)',
      '',
      'API endpoint used by the app:',
      '- POST /api/messages/send',
      '',
      'Note: SMS is stubbed (Twilio TODO).',
    ].join('\n'),
  },
  {
    slug: 'inventory-basics',
    topicId: 'inventory',
    title: 'Inventory basics: items, stock, and adjustments',
    summary: 'How inventory items are structured and how stock is tracked.',
    body: [
      'Inventory items can be parts, services, accessories, devices, tools, or prepaid.',
      '',
      'Key concepts:',
      '- quantity: current stock level',
      '- minStock/maxStock: reorder thresholds',
      '- adjust: record stock changes (received, used, damaged, etc.)',
      '',
      'Endpoints:',
      '- GET/POST /api/inventory',
      '- PUT /api/inventory/[id]',
      '- POST /api/inventory/[id]/adjust',
    ].join('\n'),
  },
  {
    slug: 'billing-trial-and-expiration',
    topicId: 'payments',
    title: 'Trials, billing, and what happens when a trial ends',
    summary: 'Fixology gates access when a trial ends or billing is inactive.',
    body: [
      'Shops have a subscription status: TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED.',
      '',
      'When a TRIAL ends:',
      '- Fixology redirects users to /onboarding?billing=required&reason=trial_expired',
      '- The page prompts “Update Billing” and routes to /settings/billing',
      '',
      'Stripe sync:',
      '- Webhooks update the shop record (recommended)',
      '- /api/stripe/subscription also performs best-effort sync as a fallback',
    ].join('\n'),
  },
  {
    slug: 'sentry-error-monitoring',
    topicId: 'integrations',
    title: 'Error monitoring (Sentry)',
    summary: 'Enable Sentry to capture frontend and backend errors in production.',
    body: [
      'Fixology supports Sentry via @sentry/nextjs.',
      '',
      'To enable:',
      '- Set SENTRY_DSN on the server',
      '- Optionally set NEXT_PUBLIC_SENTRY_DSN for client-side error capture',
      '',
      'Sentry is disabled automatically if no DSN is set.',
    ].join('\n'),
  },
]

export function getTopicById(id: string) {
  return HELP_TOPICS.find((t) => t.id === id) || null
}

export function getArticleBySlug(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug) || null
}


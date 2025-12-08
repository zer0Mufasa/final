// lib/constants.ts
// Application constants

export const APP_NAME = 'Fixology'
export const APP_DESCRIPTION = 'AI-Powered Repair Intelligence Platform'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fixologyai.com'

export const SUPPORT_EMAIL = 'repair@fixologyai.com'

// Subscription plans with features
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: {
      max_tickets: 25,
      max_users: 1,
      max_customers: 100,
      sms: false,
      ai: false,
      workflows: false,
    },
    description: 'Perfect for trying out Fixology',
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    features: {
      max_tickets: 100,
      max_users: 3,
      max_customers: 500,
      sms: true,
      ai: true,
      workflows: false,
    },
    description: 'For small repair shops',
  },
  PRO: {
    name: 'Pro',
    price: 79,
    features: {
      max_tickets: 500,
      max_users: 10,
      max_customers: 2000,
      sms: true,
      ai: true,
      workflows: true,
    },
    description: 'For growing businesses',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    features: {
      max_tickets: -1, // unlimited
      max_users: -1,
      max_customers: -1,
      sms: true,
      ai: true,
      workflows: true,
    },
    description: 'For large operations',
  },
}

// Ticket status configuration
export const TICKET_STATUSES = {
  INTAKE: {
    label: 'Intake',
    color: 'blue',
    description: 'Device received, awaiting diagnosis',
  },
  DIAGNOSED: {
    label: 'Diagnosed',
    color: 'purple',
    description: 'Issue identified, awaiting approval',
  },
  WAITING_PARTS: {
    label: 'Waiting Parts',
    color: 'yellow',
    description: 'Parts on order',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'indigo',
    description: 'Repair in progress',
  },
  READY: {
    label: 'Ready',
    color: 'green',
    description: 'Repair complete, ready for pickup',
  },
  PICKED_UP: {
    label: 'Picked Up',
    color: 'gray',
    description: 'Customer has picked up device',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'red',
    description: 'Repair cancelled',
  },
}

// Ticket priority configuration
export const TICKET_PRIORITIES = {
  LOW: {
    label: 'Low',
    color: 'gray',
  },
  NORMAL: {
    label: 'Normal',
    color: 'blue',
  },
  HIGH: {
    label: 'High',
    color: 'yellow',
  },
  URGENT: {
    label: 'Urgent',
    color: 'red',
  },
}

// Common device brands
export const DEVICE_BRANDS = [
  'Apple',
  'Samsung',
  'Google',
  'OnePlus',
  'Motorola',
  'LG',
  'Sony',
  'Microsoft',
  'Nintendo',
  'Other',
]

// Common device types
export const DEVICE_TYPES = [
  'Phone',
  'Tablet',
  'Laptop',
  'Desktop',
  'Console',
  'Smartwatch',
  'Other',
]

// Inventory categories
export const INVENTORY_CATEGORIES = {
  PARTS: {
    label: 'Parts',
    icon: '🔧',
    description: 'Replacement parts for repairs',
  },
  SERVICES: {
    label: 'Services',
    icon: '⚡',
    description: 'Labor and service items',
  },
  ACCESSORIES: {
    label: 'Accessories',
    icon: '🎧',
    description: 'Cases, chargers, screen protectors',
  },
  DEVICES: {
    label: 'Devices',
    icon: '📱',
    description: 'Phones, tablets, refurbished devices',
  },
  TOOLS: {
    label: 'Tools',
    icon: '🛠️',
    description: 'Repair tools and equipment',
  },
  PREPAID: {
    label: 'Prepaid',
    icon: '💳',
    description: 'Prepaid cards and plans',
  },
}

// Trial duration in days
export const TRIAL_DURATION_DAYS = 14


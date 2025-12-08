// types/index.ts
// Shared TypeScript types

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'

export type ShopStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'

export type ShopRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'FRONT_DESK'

export type UserStatus = 'ACTIVE' | 'INVITED' | 'DISABLED'

export type TicketStatus = 
  | 'INTAKE' 
  | 'DIAGNOSED' 
  | 'WAITING_PARTS' 
  | 'IN_PROGRESS' 
  | 'READY' 
  | 'PICKED_UP' 
  | 'CANCELLED'

export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type InventoryCategory = 
  | 'PARTS' 
  | 'SERVICES' 
  | 'ACCESSORIES' 
  | 'DEVICES' 
  | 'TOOLS' 
  | 'PREPAID'

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'VIEWED' 
  | 'PARTIAL' 
  | 'PAID' 
  | 'OVERDUE' 
  | 'CANCELLED' 
  | 'REFUNDED'

export type PaymentMethod = 'CASH' | 'CARD' | 'CHECK' | 'OTHER'

export interface ShopFeatures {
  max_tickets: number
  max_users: number
  max_customers: number
  sms: boolean
  ai: boolean
  workflows: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: ShopRole
  avatarUrl?: string
}

export interface Shop {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country: string
  timezone: string
  currency: string
  logoUrl?: string
  plan: SubscriptionPlan
  status: ShopStatus
  features: ShopFeatures
}

export interface Customer {
  id: string
  shopId: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  zip?: string
  notes?: string
  tags: string[]
  isVip: boolean
  totalSpent: number
  ticketCount: number
}

export interface Ticket {
  id: string
  shopId: string
  ticketNumber: string
  customerId: string
  customer?: Customer
  deviceType: string
  deviceBrand: string
  deviceModel?: string
  deviceColor?: string
  imei?: string
  serialNumber?: string
  passcode?: string
  issueDescription: string
  symptoms: string[]
  diagnosis?: string
  resolution?: string
  status: TicketStatus
  priority: TicketPriority
  assignedToId?: string
  assignedTo?: User
  createdById: string
  createdBy?: User
  estimatedCost?: number
  actualCost?: number
  intakeAt: string
  diagnosedAt?: string
  repairedAt?: string
  completedAt?: string
  pickedUpAt?: string
  dueAt?: string
}

export interface InventoryItem {
  id: string
  shopId: string
  name: string
  sku?: string
  description?: string
  category: InventoryCategory
  costPrice?: number
  sellPrice: number
  quantity: number
  minStock: number
  maxStock?: number
  location?: string
  brand?: string
  model?: string
  imageUrl?: string
  isActive: boolean
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface ApiError {
  error: string
  details?: Record<string, string>
}


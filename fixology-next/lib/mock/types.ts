export type TicketStatus =
  | 'INTAKE'
  | 'DIAGNOSED'
  | 'WAITING_PARTS'
  | 'IN_REPAIR'
  | 'READY'
  | 'PICKED_UP'
  | 'CANCELLED'

export type RiskFlag = 'none' | 'low' | 'medium' | 'high'

export type TicketNote = {
  id: string
  text: string
  author: string
  createdAt: string // ISO
  isInternal: boolean
}

export type StatusChange = {
  from: TicketStatus | null
  to: TicketStatus
  changedBy: string
  changedAt: string // ISO
  note?: string
}

export type PartUsage = {
  partId: string
  partName: string
  quantity: number
  unitPrice: number
}

export type Ticket = {
  id: string
  ticketNumber: string
  
  // Customer
  customerId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  
  // Device
  device: string
  deviceType?: string
  deviceModel?: string
  imei?: string
  passcode?: string
  
  // Repair
  issue?: string
  symptoms?: string[]
  diagnosis?: string
  repairType?: string
  
  // Status & Timeline
  status: TicketStatus
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  promisedAt: string // ISO
  createdAt: string // ISO
  startedAt?: string // ISO
  completedAt?: string // ISO
  
  // Pricing
  price: number
  deposit?: number
  depositPaid?: boolean
  
  // Assignment & Risk
  assignedTo?: string
  risk: RiskFlag
  riskReasons?: string[]
  
  // Tracking
  partsUsed?: PartUsage[]
  notes?: TicketNote[]
  statusHistory?: StatusChange[]
  
  // Meta
  source?: 'walk-in' | 'appointment' | 'mail-in' | 'ai-intake'
  tags?: string[]
}

export type CustomerDevice = {
  id: string
  type: string
  model: string
  imei?: string
  serialNumber?: string
  notes?: string
  repairCount: number
}

export type Customer = {
  id: string
  
  // Basic info
  firstName: string
  lastName: string
  name: string // Computed or stored for display
  phone: string
  email?: string
  address?: string
  
  // Preferences
  preferredContact?: 'phone' | 'email' | 'sms'
  notes?: string
  
  // Stats
  lastVisit: string // ISO
  firstVisit?: string // ISO
  openTickets: number
  totalTickets?: number
  lifetimeValue: number
  averageTicketValue?: number
  
  // Status
  isVIP?: boolean
  isFlagged?: boolean
  flagReason?: string
  
  // Devices
  devices?: CustomerDevice[]
  
  // Tags
  tags?: string[]
  
  createdAt?: string // ISO
  updatedAt?: string // ISO
}

export type InventoryCategory = 
  | 'screens'
  | 'batteries'
  | 'ports'
  | 'cameras'
  | 'speakers'
  | 'housings'
  | 'adhesives'
  | 'tools'
  | 'accessories'
  | 'other'

export type InventoryItem = {
  id: string
  name: string
  sku: string
  category: InventoryCategory
  vendor: string
  onHand: number
  min: number
  unitCost: number
  retail: number
  leadTimeDays: number
  location?: string
  notes?: string
  lastOrdered?: string
  lastSold?: string
}

// ============ INVOICES ============

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'void'

export type InvoiceItem = {
  id: string
  type: 'labor' | 'part' | 'accessory' | 'other'
  description: string
  quantity: number
  unitPrice: number
  total: number
  partId?: string
  warrantyIncluded: boolean
}

export type Invoice = {
  id: string
  invoiceNumber: string
  ticketId?: string
  ticketNumber?: string
  customerId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  
  items: InvoiceItem[]
  
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  discountType: 'fixed' | 'percent'
  total: number
  
  status: InvoiceStatus
  amountPaid: number
  amountDue: number
  
  issueDate: string
  dueDate: string
  paidDate?: string
  
  sentVia?: 'email' | 'sms' | 'print'
  sentAt?: string
  viewedAt?: string
  paymentLink?: string
  
  notes?: string
  
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============ PAYMENTS ============

export type PaymentMethod = 
  | 'cash'
  | 'card'
  | 'card-manual'
  | 'apple-pay'
  | 'google-pay'
  | 'cash-app'
  | 'venmo'
  | 'zelle'
  | 'check'
  | 'store-credit'
  | 'other'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type Payment = {
  id: string
  invoiceId?: string
  invoiceNumber?: string
  ticketId?: string
  ticketNumber?: string
  customerId?: string
  customerName: string
  
  amount: number
  tip?: number
  totalAmount: number
  
  method: PaymentMethod
  reference?: string
  
  status: PaymentStatus
  processor?: string
  processorFee?: number
  netAmount: number
  
  refundedAmount?: number
  refundReason?: string
  refundedAt?: string
  
  collectedBy: string
  collectedByName: string
  
  createdAt: string
  updatedAt: string
}

// ============ ESTIMATES ============

export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

export type EstimateItem = {
  id: string
  type: 'labor' | 'part' | 'accessory' | 'other'
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export type Estimate = {
  id: string
  estimateNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  
  deviceType: string
  deviceModel: string
  deviceCondition?: string
  
  items: EstimateItem[]
  
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  
  status: EstimateStatus
  
  validUntil: string
  
  approvedAt?: string
  approvalSignature?: string
  declinedAt?: string
  declineReason?: string
  
  convertedToTicketId?: string
  convertedAt?: string
  
  notes?: string
  internalNotes?: string
  
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============ WARRANTY ============

export type WarrantyClaimStatus = 'pending' | 'approved' | 'denied' | 'completed'
export type WarrantyType = 'labor' | 'parts' | 'full'
export type ResolutionType = 'redo' | 'refund' | 'partial-refund' | 'replacement'

export type WarrantyClaim = {
  id: string
  ticketId: string
  ticketNumber: string
  invoiceId?: string
  customerId: string
  customerName: string
  customerPhone: string
  
  originalRepairDate: string
  originalRepairType: string
  originalTechId: string
  originalTechName: string
  originalAmount: number
  
  warrantyPeriod: number
  warrantyExpires: string
  warrantyType: WarrantyType
  
  claimDate: string
  claimReason: string
  claimDescription: string
  
  status: WarrantyClaimStatus
  resolution?: string
  resolutionType?: ResolutionType
  resolutionAmount?: number
  resolutionTicketId?: string
  
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  
  createdAt: string
  updatedAt: string
}

export type WarrantyInfo = {
  ticketId: string
  ticketNumber: string
  customerName: string
  customerPhone: string
  repairType: string
  repairDate: string
  warrantyPeriod: number
  warrantyExpires: string
  warrantyType: WarrantyType
  isActive: boolean
  daysRemaining: number
}



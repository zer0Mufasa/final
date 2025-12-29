export type TicketStatus =
  | 'INTAKE'
  | 'DIAGNOSED'
  | 'WAITING_PARTS'
  | 'IN_REPAIR'
  | 'READY'
  | 'PICKED_UP'

export type RiskFlag = 'none' | 'low' | 'medium' | 'high'

export type Ticket = {
  id: string
  ticketNumber: string
  customerName: string
  customerPhone: string
  device: string
  status: TicketStatus
  promisedAt: string // ISO
  risk: RiskFlag
  price: number
  assignedTo?: string
  createdAt: string // ISO
}

export type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  tags?: string[]
  lastVisit: string // ISO
  openTickets: number
  lifetimeValue: number
}

export type InventoryItem = {
  id: string
  name: string
  sku: string
  vendor: string
  onHand: number
  min: number
  unitCost: number
  retail: number
  leadTimeDays: number
}



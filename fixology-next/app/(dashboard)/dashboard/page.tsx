// app/(dashboard)/dashboard/page.tsx
// Command Center Dashboard - Kanban board with focus panel

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { LeftRail } from '@/components/dashboard/left-rail'
import { CommandCenter } from '@/components/dashboard/command-center'
import { QuickAIIntake } from '@/components/dashboard/quick-ai-intake'

export const metadata = {
  title: 'Dashboard',
}

async function getTickets(shopId: string) {
  const tickets = await prisma.ticket.findMany({
    where: {
      shopId,
      status: { notIn: ['CANCELLED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
    },
    take: 100, // Limit for performance
  })

  return tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    deviceBrand: ticket.deviceBrand,
    deviceModel: ticket.deviceModel,
    deviceType: ticket.deviceType,
    deviceIssue: ticket.issueDescription || null,
    problem: ticket.symptoms?.join(', ') || null,
    issueDescription: ticket.issueDescription || null,
    symptoms: ticket.symptoms || null,
    diagnosis: ticket.diagnosis || null,
    resolution: ticket.resolution || null,
    priority: ticket.priority || 'NORMAL',
    customer: {
      firstName: ticket.customer.firstName,
      lastName: ticket.customer.lastName,
      phone: ticket.customer.phone,
      email: ticket.customer.email,
    },
    status: ticket.status,
    dueAt: ticket.dueAt,
    estimatedCost: ticket.estimatedCost ? Number(ticket.estimatedCost) : null,
    actualCost: ticket.actualCost ? Number(ticket.actualCost) : null,
    notes: null, // TODO: Add notes field to schema
    createdAt: ticket.createdAt,
    intakeAt: ticket.intakeAt,
    diagnosedAt: ticket.diagnosedAt,
    repairedAt: ticket.repairedAt,
    completedAt: ticket.completedAt,
    pickedUpAt: ticket.pickedUpAt,
  }))
}

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const shopUser = await prisma.shopUser.findFirst({
    where: {
      email: session?.user?.email!,
      status: 'ACTIVE',
    },
    include: {
      shop: true,
    },
  })

  if (!shopUser) {
    return null
  }

  const tickets = await getTickets(shopUser.shopId)
  const cityState = [shopUser.shop.city, shopUser.shop.state].filter(Boolean).join(', ')

  return (
    <div className="relative">
      {/* Hide layout sidebar for dashboard */}
      <style dangerouslySetInnerHTML={{ __html: '.dash-main { padding-left: 0 !important; }' }} />
      <LeftRail />
      <div className="ml-16 flex flex-col h-screen">
        <Header
          shopName={shopUser.shop.name}
          location={cityState}
          user={{
            name: shopUser.name,
            email: shopUser.email,
          }}
        />
                    <div className="flex-1 overflow-hidden p-6">
                      <QuickAIIntake />
                      <CommandCenter tickets={tickets} />
                    </div>
      </div>
    </div>
  )
}

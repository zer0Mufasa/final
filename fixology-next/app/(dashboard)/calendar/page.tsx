// app/(dashboard)/calendar/page.tsx
// Calendar page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { Calendar as CalendarIcon } from 'lucide-react'

export const metadata = {
  title: 'Calendar',
}

export default async function CalendarPage() {
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

  // Get upcoming appointments/pickups
  const upcomingTickets = await prisma.ticket.findMany({
    where: {
      shopId: shopUser.shopId,
      status: { in: ['READY', 'IN_PROGRESS'] },
      dueAt: { gte: new Date() },
    },
    include: {
      customer: true,
    },
    orderBy: { dueAt: 'asc' },
    take: 10,
  })

  return (
    <>
      <Header
        title="Calendar"
        description="View appointments and scheduled pickups"
      />

      <div className="p-6">
        <div className="glass-card">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-lg font-semibold text-white mb-2">Calendar View</p>
            <p className="text-sm text-white/60 mb-6">Calendar functionality coming soon</p>

            {upcomingTickets.length > 0 && (
              <div className="mt-8 space-y-3 max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-white/80 mb-4">Upcoming Items</h3>
                {upcomingTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl bg-white/[0.04] border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{ticket.ticketNumber}</p>
                        <p className="text-sm text-white/60">
                          {ticket.customer.firstName} {ticket.customer.lastName} • {ticket.deviceBrand} {ticket.deviceType}
                        </p>
                      </div>
                      {ticket.dueAt && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {new Date(ticket.dueAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-white/60">
                            {new Date(ticket.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


// app/(dashboard)/tickets/page.tsx
// Tickets list page (themed to match homepage/login/onboarding)

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { Ticket, Plus, Search } from 'lucide-react'

export const metadata = {
  title: 'Tickets',
}

export default async function TicketsPage() {
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

  const tickets = await prisma.ticket.findMany({
    where: { shopId: shopUser.shopId },
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
    },
  })

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      INTAKE: 'bg-blue-500/20 text-blue-400',
      DIAGNOSED: 'bg-purple-500/20 text-purple-400',
      WAITING_PARTS: 'bg-yellow-500/20 text-yellow-400',
      IN_PROGRESS: 'bg-indigo-500/20 text-indigo-400',
      READY: 'bg-green-500/20 text-green-400',
      PICKED_UP: 'bg-gray-500/20 text-gray-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    }
    return statusClasses[status] || 'bg-gray-500/20 text-gray-400'
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <>
      <Header
        title="Tickets"
        description={`${tickets.length} total tickets`}
        actions={
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
        }
      />

      <div className="p-6">
        <div className="glass-card">
          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {ticket.ticketNumber} - {ticket.deviceBrand} {ticket.deviceModel || ticket.deviceType}
                    </p>
                    <p className="text-sm text-white/60 truncate">
                      {ticket.customer.firstName} {ticket.customer.lastName} • {ticket.customer.email || ticket.customer.phone}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(ticket.status)}`}>
                    {formatStatus(ticket.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">No tickets yet</p>
              <p className="text-sm text-white/60 mb-6">Create your first repair ticket to get started.</p>
              <Link
                href="/tickets/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


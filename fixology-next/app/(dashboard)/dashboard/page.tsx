// app/(dashboard)/dashboard/page.tsx
// Main dashboard page (themed to match homepage/login/onboarding)

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import {
  Ticket,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package,
  Plus,
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard',
}

async function getStats(shopId: string) {
  const [openTickets, totalCustomers, readyTickets, inventoryItems, recentTickets] =
    await Promise.all([
      prisma.ticket.count({
        where: {
          shopId,
          status: { notIn: ['PICKED_UP', 'CANCELLED'] },
        },
      }),
      prisma.customer.count({
        where: { shopId },
      }),
      prisma.ticket.count({
        where: {
          shopId,
          status: 'READY',
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          shopId,
          isActive: true,
        },
        select: {
          quantity: true,
          minStock: true,
        },
      }),
      prisma.ticket.findMany({
        where: { shopId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
        },
      }),
    ])

  const lowStockCount = inventoryItems.filter(
    (item) => item.quantity <= (item.minStock || 0)
  ).length

  return {
    openTickets,
    totalCustomers,
    readyTickets,
    lowStockCount,
    recentTickets,
  }
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

  const stats = await getStats(shopUser.shopId)
  const cityState = [shopUser.shop.city, shopUser.shop.state].filter(Boolean).join(', ')
  const greeting =
    `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ` +
    `${shopUser.name.split(' ')[0]}!`

  const statCards = [
    {
      label: 'Open Tickets',
      value: stats.openTickets,
      icon: <Ticket className="w-6 h-6 text-white" />,
      gradient: 'from-blue-500 to-blue-700',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: 'from-teal-500 to-teal-700',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Ready for Pickup',
      value: stats.readyTickets,
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      gradient: 'from-green-500 to-green-700',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: <Package className="w-6 h-6 text-white" />,
      gradient: stats.lowStockCount > 0 ? 'from-red-500 to-red-700' : 'from-yellow-500 to-yellow-700',
    },
  ]

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
      <Header title={shopUser.shop.name} description={cityState ? `${cityState} • ${greeting}` : greeting} />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="glass-card flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-sm ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                  <TrendingUp className={`w-4 h-4 ${!stat.trendUp && 'rotate-180'}`} />
                  {stat.trend}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tickets */}
          <div className="lg:col-span-2 glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Recent Tickets</h2>
              <Link href="/tickets" className="text-sm text-[#a78bfa] hover:text-[#c4b5fd] transition-colors">
                View all →
              </Link>
            </div>

            {stats.recentTickets.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTickets.map((ticket) => (
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
                        {ticket.customer.firstName} {ticket.customer.lastName}
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

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card">
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/tickets/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">New Ticket</span>
                </Link>
                <Link
                  href="/customers/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">Add Customer</span>
                </Link>
                <Link
                  href="/invoices/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">New Invoice</span>
                </Link>
                <Link
                  href="/diagnostics"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-white/80 font-medium">AI Diagnose</span>
                </Link>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card">
              <h2 className="text-lg font-bold text-white mb-4">Alerts</h2>
              <div className="space-y-3">
                {stats.lowStockCount > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-400">Low Stock Alert</p>
                      <p className="text-xs text-white/60">{stats.lowStockCount} items need restocking</p>
                    </div>
                  </div>
                )}
                {stats.readyTickets > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Ready for Pickup</p>
                      <p className="text-xs text-white/60">{stats.readyTickets} repairs ready for customers</p>
                    </div>
                  </div>
                )}
                {stats.lowStockCount === 0 && stats.readyTickets === 0 && (
                  <p className="text-sm text-white/60 text-center py-4">No alerts at this time 🎉</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

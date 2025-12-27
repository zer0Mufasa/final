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
  ArrowRight,
  Sparkles,
  Zap,
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

      <div className="p-8 space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent border border-purple-500/20 p-8 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{greeting}</h2>
            </div>
            <p className="text-white/70 text-sm">Here's what's happening at your shop today</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/5 group-hover:to-purple-600/5 transition-all duration-300 rounded-2xl" />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-white/60 font-medium">{stat.label}</p>
                  {stat.trend && (
                    <div className={`flex items-center gap-1.5 mt-3 text-xs font-semibold ${stat.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                      <TrendingUp className={`w-3.5 h-3.5 ${!stat.trendUp && 'rotate-180'}`} />
                      {stat.trend}
                    </div>
                  )}
                </div>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tickets */}
          <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 hover:border-white/15 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/20">
                  <Ticket className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Recent Tickets</h2>
              </div>
              <Link 
                href="/tickets" 
                className="group flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {stats.recentTickets.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTickets.map((ticket, idx) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/20 transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-500/5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                      <Ticket className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate mb-1">
                        {ticket.ticketNumber} - {ticket.deviceBrand} {ticket.deviceModel || ticket.deviceType}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        {ticket.customer.firstName} {ticket.customer.lastName}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadgeClass(ticket.status)} border border-current/20`}>
                      {formatStatus(ticket.status)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Ticket className="w-10 h-10 text-purple-400/60" />
                </div>
                <p className="text-xl font-bold text-white mb-2">No tickets yet</p>
                <p className="text-sm text-white/60 mb-8 max-w-sm mx-auto">Create your first repair ticket to get started with Fixology.</p>
                <Link
                  href="/tickets/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40"
                >
                  <Plus className="w-5 h-5" />
                  Create First Ticket
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/tickets/new"
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-semibold">New Ticket</span>
                </Link>
                <Link
                  href="/customers/new"
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-teal-500/30 transition-all hover:shadow-lg hover:shadow-teal-500/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-semibold">Add Customer</span>
                </Link>
                <Link
                  href="/invoices/new"
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-500/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-semibold">New Invoice</span>
                </Link>
                <Link
                  href="/diagnostics"
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm text-white/90 font-semibold">AI Diagnose</span>
                </Link>
              </div>
            </div>

            {/* Alerts */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center border border-yellow-500/20">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Alerts</h2>
              </div>
              <div className="space-y-3">
                {stats.lowStockCount > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/15 transition-colors">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-400 mb-1">Low Stock Alert</p>
                      <p className="text-xs text-white/60">{stats.lowStockCount} items need restocking</p>
                    </div>
                  </div>
                )}
                {stats.readyTickets > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-400 mb-1">Ready for Pickup</p>
                      <p className="text-xs text-white/60">{stats.readyTickets} repairs ready for customers</p>
                    </div>
                  </div>
                )}
                {stats.lowStockCount === 0 && stats.readyTickets === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400/60" />
                    </div>
                    <p className="text-sm text-white/60 font-medium">All clear! 🎉</p>
                    <p className="text-xs text-white/40 mt-1">No alerts at this time</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// app/(dashboard)/dashboard/page.tsx
// Main dashboard page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { 
  Ticket, 
  Users, 
  DollarSign, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard',
}

async function getStats(shopId: string) {
  const [
    openTickets,
    totalCustomers,
    readyTickets,
    lowStockCount,
    recentTickets,
  ] = await Promise.all([
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
    prisma.inventoryItem.count({
      where: {
        shopId,
        quantity: { lte: prisma.inventoryItem.fields.minStock },
        isActive: true,
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

  const statCards = [
    {
      label: 'Open Tickets',
      value: stats.openTickets,
      icon: <Ticket className="w-6 h-6 text-white" />,
      gradient: 'gradient-blue',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: 'gradient-teal',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Ready for Pickup',
      value: stats.readyTickets,
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      gradient: 'gradient-green',
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: <Package className="w-6 h-6 text-white" />,
      gradient: stats.lowStockCount > 0 ? 'gradient-red' : 'gradient-yellow',
    },
  ]

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      INTAKE: 'status-intake',
      DIAGNOSED: 'status-diagnosed',
      WAITING_PARTS: 'status-waiting',
      IN_PROGRESS: 'status-progress',
      READY: 'status-ready',
      PICKED_UP: 'status-picked',
      CANCELLED: 'status-cancelled',
    }
    return statusClasses[status] || 'badge-gray'
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <>
      <Header 
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${shopUser.name.split(' ')[0]}!`}
        description={`Here's what's happening at ${shopUser.shop.name} today.`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="glass-card flex items-center gap-4 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`gradient-icon ${stat.gradient}`}>
                {stat.icon}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                  {stat.value}
                </p>
                <p className="text-sm text-[rgb(var(--text-muted))]">
                  {stat.label}
                </p>
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
          <div className="lg:col-span-2 glass-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="card-header">
              <h2 className="card-title">Recent Tickets</h2>
              <a href="/tickets" className="text-sm text-[rgb(var(--accent-light))] hover:underline">
                View all →
              </a>
            </div>
            
            {stats.recentTickets.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-card-hover))] transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                        {ticket.ticketNumber} - {ticket.deviceBrand} {ticket.deviceModel || ticket.deviceType}
                      </p>
                      <p className="text-sm text-[rgb(var(--text-muted))] truncate">
                        {ticket.customer.firstName} {ticket.customer.lastName}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                      {formatStatus(ticket.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Ticket className="w-8 h-8 text-[rgb(var(--text-muted))]" />
                </div>
                <p className="empty-state-title">No tickets yet</p>
                <p className="empty-state-description">
                  Create your first repair ticket to get started.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <h2 className="card-title mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="/tickets/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-card-hover))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">New Ticket</span>
                </a>
                <a 
                  href="/customers/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-card-hover))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">Add Customer</span>
                </a>
                <a 
                  href="/invoices/new"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-card-hover))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">New Invoice</span>
                </a>
                <a 
                  href="/diagnostics"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[rgb(var(--bg-tertiary))] hover:bg-[rgb(var(--bg-card-hover))] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-[rgb(var(--text-secondary))]">AI Diagnose</span>
                </a>
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h2 className="card-title mb-4">Alerts</h2>
              <div className="space-y-3">
                {stats.lowStockCount > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">Low Stock Alert</p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {stats.lowStockCount} items need restocking
                      </p>
                    </div>
                  </div>
                )}
                {stats.readyTickets > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Ready for Pickup</p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {stats.readyTickets} repairs ready for customers
                      </p>
                    </div>
                  </div>
                )}
                {stats.lowStockCount === 0 && stats.readyTickets === 0 && (
                  <p className="text-sm text-[rgb(var(--text-muted))] text-center py-4">
                    No alerts at this time 🎉
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


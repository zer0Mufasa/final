// app/(admin)/admin/page.tsx
// Admin overview dashboard

import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { 
  Store, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard',
}

async function getAdminStats() {
  const [
    totalShops,
    activeShops,
    trialShops,
    totalUsers,
    recentShops,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: 'ACTIVE' } }),
    prisma.shop.count({ where: { status: 'TRIAL' } }),
    prisma.shopUser.count(),
    prisma.shop.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'OWNER' },
          take: 1,
        },
        _count: {
          select: { tickets: true, customers: true },
        },
      },
    }),
  ])

  // Calculate MRR (Mock calculation)
  const proShops = await prisma.shop.count({ where: { plan: 'PRO' } })
  const starterShops = await prisma.shop.count({ where: { plan: 'STARTER' } })
  const enterpriseShops = await prisma.shop.count({ where: { plan: 'ENTERPRISE' } })
  
  const mrr = (proShops * 79) + (starterShops * 29) + (enterpriseShops * 199)

  return {
    totalShops,
    activeShops,
    trialShops,
    totalUsers,
    mrr,
    recentShops,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const statCards = [
    {
      label: 'Total Shops',
      value: stats.totalShops,
      icon: <Store className="w-6 h-6 text-white" />,
      gradient: 'gradient-purple',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Active Shops',
      value: stats.activeShops,
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      gradient: 'gradient-green',
    },
    {
      label: 'Trial Shops',
      value: stats.trialShops,
      icon: <Clock className="w-6 h-6 text-white" />,
      gradient: 'gradient-yellow',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.mrr.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6 text-white" />,
      gradient: 'gradient-teal',
      trend: '+18%',
      trendUp: true,
    },
  ]

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      TRIAL: 'badge-yellow',
      ACTIVE: 'badge-green',
      PAST_DUE: 'badge-red',
      SUSPENDED: 'badge-red',
      CANCELLED: 'badge-gray',
    }
    return badges[status] || 'badge-gray'
  }

  const getPlanBadge = (plan: string) => {
    const badges: Record<string, string> = {
      FREE: 'badge-gray',
      STARTER: 'badge-blue',
      PRO: 'badge-purple',
      ENTERPRISE: 'badge-purple',
    }
    return badges[plan] || 'badge-gray'
  }

  return (
    <>
      <Header 
        title="Platform Overview"
        description="Monitor all Fixology shops and platform metrics"
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

        {/* Recent Shops */}
        <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h2 className="card-title">Recent Shops</h2>
            <a href="/admin/shops" className="text-sm text-[rgb(var(--accent-light))] hover:underline">
              View all →
            </a>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Tickets</th>
                  <th>Customers</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentShops.map((shop) => (
                  <tr key={shop.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                          <Store className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[rgb(var(--text-primary))]">
                            {shop.name}
                          </p>
                          <p className="text-xs text-[rgb(var(--text-muted))]">
                            {shop.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-[rgb(var(--text-primary))]">
                          {shop.users[0]?.name || 'No owner'}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                          {shop.users[0]?.email || shop.email}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getPlanBadge(shop.plan)}`}>
                        {shop.plan}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(shop.status)}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="text-[rgb(var(--text-primary))]">
                      {shop._count.tickets}
                    </td>
                    <td className="text-[rgb(var(--text-primary))]">
                      {shop._count.customers}
                    </td>
                    <td className="text-[rgb(var(--text-muted))]">
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="card-title mb-4">Plan Distribution</h2>
            <div className="space-y-4">
              {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].map(async (plan) => {
                const count = await prisma.shop.count({ where: { plan: plan as any } })
                const percentage = stats.totalShops > 0 ? (count / stats.totalShops) * 100 : 0
                
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[rgb(var(--text-secondary))]">{plan}</span>
                      <span className="text-sm text-[rgb(var(--text-primary))]">{count}</span>
                    </div>
                    <div className="h-2 bg-[rgb(var(--bg-tertiary))] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          plan === 'FREE' ? 'bg-gray-500' :
                          plan === 'STARTER' ? 'bg-blue-500' :
                          plan === 'PRO' ? 'bg-purple-500' :
                          'bg-purple-700'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Platform Health */}
          <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <h2 className="card-title mb-4">Platform Health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">API Status</span>
                </div>
                <span className="text-sm text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Database</span>
                </div>
                <span className="text-sm text-green-400">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Auth Service</span>
                </div>
                <span className="text-sm text-green-400">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


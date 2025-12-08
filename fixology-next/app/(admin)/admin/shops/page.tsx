// app/(admin)/admin/shops/page.tsx
// Admin page to view all shops

import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { 
  Store, 
  Search,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'

export const metadata = {
  title: 'All Shops | Admin',
}

async function getShops() {
  return prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        where: { role: 'OWNER' },
        take: 1,
      },
      _count: {
        select: { tickets: true, customers: true, users: true },
      },
    },
  })
}

export default async function AdminShopsPage() {
  const shops = await getShops()

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
        title="All Shops"
        description={`${shops.length} registered shops on the platform`}
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder="Search shops..."
              className="input pl-12"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="select">
              <option value="">All Plans</option>
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select className="select">
              <option value="">All Status</option>
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop, index) => (
            <Link
              key={shop.id}
              href={`/admin/shops/${shop.id}`}
              className="glass-card group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent-light))] transition-colors">
                      {shop.name}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      /{shop.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${getStatusBadge(shop.status)}`}>
                    {shop.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--text-muted))]">Owner</span>
                  <span className="text-[rgb(var(--text-secondary))]">
                    {shop.users[0]?.name || 'No owner'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--text-muted))]">Plan</span>
                  <span className={`badge ${getPlanBadge(shop.plan)}`}>
                    {shop.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--text-muted))]">Created</span>
                  <span className="text-[rgb(var(--text-secondary))]">
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="divider !my-4" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    {shop._count.tickets}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Tickets</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    {shop._count.customers}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Customers</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    {shop._count.users}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">Users</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {shops.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Store className="w-8 h-8 text-[rgb(var(--text-muted))]" />
            </div>
            <p className="empty-state-title">No shops yet</p>
            <p className="empty-state-description">
              Shops will appear here once they sign up.
            </p>
          </div>
        )}
      </div>
    </>
  )
}


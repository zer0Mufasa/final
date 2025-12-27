// app/(dashboard)/reports/page.tsx
// Reports page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Reports',
}

export default async function ReportsPage() {
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

  // Get basic stats
  const [ticketCount, customerCount, invoiceTotal, inventoryCount] = await Promise.all([
    prisma.ticket.count({ where: { shopId: shopUser.shopId } }),
    prisma.customer.count({ where: { shopId: shopUser.shopId } }),
    prisma.invoice.aggregate({
      where: { shopId: shopUser.shopId, status: 'PAID' },
      _sum: { total: true },
    }),
    prisma.inventoryItem.count({ where: { shopId: shopUser.shopId, isActive: true } }),
  ])

  const stats = [
    { label: 'Total Tickets', value: ticketCount, color: 'purple' },
    { label: 'Customers', value: customerCount, color: 'teal' },
    { label: 'Revenue', value: invoiceTotal._sum.total ? `$${Number(invoiceTotal._sum.total).toFixed(2)}` : '$0.00', color: 'green' },
    { label: 'Inventory Items', value: inventoryCount, color: 'blue' },
  ]

  return (
    <>
      <Header
        title="Reports"
        description="View analytics and insights"
      />

      <div className="p-6">
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Business Overview</h2>
              <p className="text-sm text-white/60">Key metrics and statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/10"
              >
                <p className="text-sm text-white/60 mb-2">{stat.label}</p>
                <p className={`text-2xl font-bold ${
                  stat.color === 'purple' ? 'text-purple-400' :
                  stat.color === 'teal' ? 'text-teal-400' :
                  stat.color === 'green' ? 'text-green-400' :
                  'text-blue-400'
                }`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center py-12 border-t border-white/10">
            <p className="text-white/60">Detailed reports and analytics coming soon</p>
          </div>
        </div>
      </div>
    </>
  )
}


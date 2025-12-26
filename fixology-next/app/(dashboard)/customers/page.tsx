// app/(dashboard)/customers/page.tsx
// Customers list page (themed to match homepage/login/onboarding)

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

export const metadata = {
  title: 'Customers',
}

export default async function CustomersPage() {
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

  const customers = await prisma.customer.findMany({
    where: { shopId: shopUser.shopId },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <>
      <Header
        title="Customers"
        description={`${customers.length} total customers`}
        actions={
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Link>
        }
      />

      <div className="p-6">
        <div className="glass-card">
          {customers.length > 0 ? (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-sm text-white/60 truncate">
                      {customer.email || customer.phone || 'No contact info'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">No customers yet</p>
              <p className="text-sm text-white/60 mb-6">Add your first customer to get started.</p>
              <Link
                href="/customers/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


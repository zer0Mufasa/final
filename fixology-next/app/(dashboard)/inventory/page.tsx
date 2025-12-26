// app/(dashboard)/inventory/page.tsx
// Inventory list page (themed to match homepage/login/onboarding)

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { Package, Plus, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Inventory',
}

export default async function InventoryPage() {
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

  const items = await prisma.inventoryItem.findMany({
    where: { shopId: shopUser.shopId, isActive: true },
    take: 50,
    orderBy: { name: 'asc' },
  })

  return (
    <>
      <Header
        title="Inventory"
        description={`${items.length} active items`}
        actions={
          <Link
            href="/inventory/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        }
      />

      <div className="p-6">
        <div className="glass-card">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => {
                const isLowStock = item.quantity <= (item.minStock || 0)
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-white/15 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isLowStock ? 'from-red-500/20 to-red-600/20' : 'from-blue-500/20 to-blue-600/20'} flex items-center justify-center`}>
                      <Package className={`w-5 h-5 ${isLowStock ? 'text-red-400' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        SKU: {item.sku || 'N/A'} • {item.quantity} in stock
                        {item.minStock && ` (min: ${item.minStock})`}
                      </p>
                    </div>
                    {isLowStock && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">No inventory items yet</p>
              <p className="text-sm text-white/60 mb-6">Add your first inventory item to get started.</p>
              <Link
                href="/inventory/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


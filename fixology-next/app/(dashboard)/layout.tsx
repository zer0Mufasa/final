// app/(dashboard)/layout.tsx
// Layout for all dashboard pages (protected)

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get shop user info
  const shopUser = await prisma.shopUser.findFirst({
    where: {
      email: session.user.email!,
      status: 'ACTIVE',
    },
    include: {
      shop: true,
    },
  })

  if (!shopUser) {
    redirect('/login?error=no_shop')
  }

  if (shopUser.shop.status === 'CANCELLED' || shopUser.shop.status === 'SUSPENDED') {
    redirect('/login?error=shop_inactive')
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <Sidebar
        user={{
          name: shopUser.name,
          email: shopUser.email,
          role: shopUser.role,
        }}
        shop={{
          name: shopUser.shop.name,
          plan: shopUser.shop.plan,
        }}
      />
      
      {/* Main content area - offset by sidebar width */}
      <main className="ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}


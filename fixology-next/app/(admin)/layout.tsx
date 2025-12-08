// app/(admin)/layout.tsx
// Layout for admin panel (platform admins only)

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
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

  // Check if platform admin
  const platformAdmin = await prisma.platformAdmin.findUnique({
    where: { email: session.user.email! },
  })

  if (!platformAdmin) {
    // Not a platform admin, redirect to regular dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))]">
      <AdminSidebar
        admin={{
          name: platformAdmin.name,
          email: platformAdmin.email,
          role: platformAdmin.role,
        }}
      />
      
      {/* Main content area - offset by sidebar width */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}


// app/(admin)/layout.tsx
// Layout for CEO Admin panel (admin_token auth via middleware)

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma/client'
import { verifyAdminToken } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin/admin-shell'
import { Toaster } from 'sonner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = cookies().get('admin_token')?.value
  if (!token) redirect('/admin/login')

  const claims = await verifyAdminToken(token)
  if (!claims) redirect('/admin/login')

  const platformAdmin = await prisma.platformAdmin.findUnique({
    where: { id: claims.id },
  })

  if (!platformAdmin) redirect('/admin/login')

  return (
    <>
      <Toaster position="top-right" richColors />
      <AdminShell
        admin={{
          name: platformAdmin.name,
          email: platformAdmin.email,
          role: platformAdmin.role,
        }}
      >
        {children}
      </AdminShell>
    </>
  )
}


// app/(dashboard)/team/page.tsx
// Team page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { UserPlus, Users } from 'lucide-react'

export const metadata = {
  title: 'Team',
}

export default async function TeamPage() {
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
      shop: {
        include: {
          users: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
  })

  if (!shopUser) {
    return null
  }

  return (
    <>
      <Header
        title="Team"
        description={`${shopUser.shop.users.length} team members`}
      />

      <div className="p-6">
        <div className="glass-card">
          {shopUser.shop.users.length > 0 ? (
            <div className="space-y-3">
              {shopUser.shop.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-[var(--text-primary)]/60 truncate">
                      {user.email} • {user.role}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-[var(--text-primary)]/40" />
              </div>
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">No team members</p>
              <p className="text-sm text-[var(--text-primary)]/60">Team management coming soon</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


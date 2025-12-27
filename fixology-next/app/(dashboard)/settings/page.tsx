// app/(dashboard)/settings/page.tsx
// Settings page

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Header } from '@/components/dashboard/header'
import { Settings as SettingsIcon } from 'lucide-react'

export const metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
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

  return (
    <>
      <Header
        title="Settings"
        description="Manage your shop settings and preferences"
      />

      <div className="p-6">
        <div className="glass-card max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Shop Settings</h2>
              <p className="text-sm text-white/60">Configure your repair shop preferences</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h3 className="font-semibold text-white mb-3">Shop Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Shop Name</span>
                  <span className="text-white font-medium">{shopUser.shop.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Location</span>
                  <span className="text-white font-medium">
                    {[shopUser.shop.city, shopUser.shop.state].filter(Boolean).join(', ') || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Plan</span>
                  <span className="text-white font-medium capitalize">{shopUser.shop.plan.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className="text-white font-medium capitalize">{shopUser.shop.status.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h3 className="font-semibold text-white mb-3">Account</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Name</span>
                  <span className="text-white font-medium">{shopUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email</span>
                  <span className="text-white font-medium">{shopUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Role</span>
                  <span className="text-white font-medium capitalize">{shopUser.role.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">
                <strong>Note:</strong> Advanced settings and configuration options coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


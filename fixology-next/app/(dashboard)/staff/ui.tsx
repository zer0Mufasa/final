'use client'

// app/(dashboard)/staff/ui.tsx
// Staff management and role permissions

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { TechLoadRing } from '@/components/dashboard/ui/workload-widgets'
import { Button } from '@/components/ui/button'
import { UserCheck, Plus, Shield, Clock, TrendingDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const mockStaff = [
  {
    id: '1',
    name: 'Ava Chen',
    role: 'TECHNICIAN',
    status: 'active',
    workload: 4,
    maxWorkload: 6,
    avgRepairTime: '2.1h',
    reworkRate: '2%',
    satisfaction: 4.8,
  },
  {
    id: '2',
    name: 'Miles Rodriguez',
    role: 'TECHNICIAN',
    status: 'active',
    workload: 3,
    maxWorkload: 6,
    avgRepairTime: '2.4h',
    reworkRate: '5%',
    satisfaction: 4.6,
  },
  {
    id: '3',
    name: 'Noah Kim',
    role: 'TECHNICIAN',
    status: 'active',
    workload: 5,
    maxWorkload: 6,
    avgRepairTime: '1.9h',
    reworkRate: '1%',
    satisfaction: 4.9,
  },
  {
    id: '4',
    name: 'Sofia Martinez',
    role: 'FRONT_DESK',
    status: 'active',
    workload: 8,
    maxWorkload: 10,
    avgRepairTime: '—',
    reworkRate: '—',
    satisfaction: 4.7,
  },
  {
    id: '5',
    name: 'Jae Park',
    role: 'TECHNICIAN',
    status: 'on_leave',
    workload: 0,
    maxWorkload: 6,
    avgRepairTime: '2.2h',
    reworkRate: '3%',
    satisfaction: 4.8,
  },
]

const permissions = [
  { action: 'Create tickets', owner: true, manager: true, technician: false, frontDesk: true },
  { action: 'Edit tickets', owner: true, manager: true, technician: true, frontDesk: false },
  { action: 'View reports', owner: true, manager: true, technician: false, frontDesk: false },
  { action: 'Manage inventory', owner: true, manager: true, technician: true, frontDesk: false },
  { action: 'Manage staff', owner: true, manager: false, technician: false, frontDesk: false },
  { action: 'View pricing', owner: true, manager: true, technician: false, frontDesk: true },
  { action: 'Access settings', owner: true, manager: false, technician: false, frontDesk: false },
]

export function StaffClient() {
  return (
    <div>
      <PageHeader
        title="Staff & Roles"
        description="People management — workload, permissions, and performance. Clear and simple."
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />}>Add staff member</Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staff list */}
        <div className="lg:col-span-2 space-y-4">
          {mockStaff.map((staff) => (
            <GlassCard key={staff.id} className="p-6 rounded-3xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                      {staff.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/90">{staff.name}</div>
                      <div className="text-xs text-white/50">{staff.role.replace('_', ' ')}</div>
                    </div>
                    <div
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-semibold',
                        staff.status === 'active'
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                      )}
                    >
                      {staff.status === 'active' ? 'Active' : 'On leave'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-white/50 mb-1">Current workload</div>
                      <div className="text-sm font-semibold text-white/90">
                        {staff.workload} / {staff.maxWorkload}
                      </div>
                    </div>
                    {staff.role === 'TECHNICIAN' && (
                      <>
                        <div>
                          <div className="text-xs text-white/50 mb-1">Avg repair time</div>
                          <div className="text-sm font-semibold text-white/90">{staff.avgRepairTime}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50 mb-1">Rework rate</div>
                          <div className="text-sm font-semibold text-white/90">{staff.reworkRate}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <div className="text-sm text-white/70">Satisfaction: {staff.satisfaction}/5.0</div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <TechLoadRing
                    name=""
                    assigned={staff.workload}
                    max={staff.maxWorkload}
                    color={staff.workload >= staff.maxWorkload * 0.8 ? 'red' : 'purple'}
                  />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Permissions matrix */}
        <div>
          <GlassCard className="p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-white/50" />
              <div className="text-sm font-semibold text-white/90">Role permissions</div>
            </div>
            <div className="space-y-3">
              {permissions.map((perm) => (
                <div key={perm.action} className="rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                  <div className="text-xs font-semibold text-white/70 mb-2">{perm.action}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {['owner', 'manager', 'technician', 'frontDesk'].map((role) => (
                      <div
                        key={role}
                        className={cn(
                          'text-center py-1 rounded-lg text-[10px] font-semibold',
                          perm[role as keyof typeof perm]
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                            : 'bg-white/5 text-white/30 border border-white/10'
                        )}
                      >
                        {perm[role as keyof typeof perm] ? '✓' : '—'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-white/50 text-center">Who can do what</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}


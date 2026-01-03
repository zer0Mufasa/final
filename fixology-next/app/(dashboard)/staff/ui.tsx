'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { toast } from '@/components/ui/toaster'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Modal } from '@/components/dashboard/ui/modal'
import { TechLoadRing } from '@/components/dashboard/ui/workload-widgets'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import {
  UserCheck,
  Plus,
  Shield,
  Clock,
  TrendingDown,
  TrendingUp,
  Star,
  User,
  Phone,
  Mail,
  Award,
  Wrench,
  Calendar,
  DollarSign,
  Activity,
  Target,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Smartphone,
  Laptop,
  Gamepad2,
  Tablet,
  BadgeCheck,
  Timer,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  role: 'owner' | 'manager' | 'technician' | 'front-desk'
  permissions: string[]
  pin?: string
  startDate: Date
  hourlyRate?: number
  isActive: boolean
  specializations: string[]
  certifications: string[]
  stats: {
    ticketsCompleted: number
    averageTime: number // hours
    customerRating: number
    warrantyClaimRate: number
    revenue: number
  }
  workingHours: {
    monday: { start: string; end: string } | null
    tuesday: { start: string; end: string } | null
    wednesday: { start: string; end: string } | null
    thursday: { start: string; end: string } | null
    friday: { start: string; end: string } | null
    saturday: { start: string; end: string } | null
    sunday: { start: string; end: string } | null
  }
  status: 'working' | 'break' | 'off'
  currentWorkload: number
  maxWorkload: number
}

const mockStaff: StaffMember[] = [
  {
    id: 'staff_1',
    firstName: 'Mufasa',
    lastName: 'Williams',
    email: 'mufasa@icenter.com',
    phone: '(512) 555-0100',
    role: 'owner',
    permissions: ['all'],
    startDate: new Date('2020-01-15'),
    hourlyRate: undefined,
    isActive: true,
    specializations: ['iPhone', 'Samsung', 'iPad', 'Microsoldering'],
    certifications: ['Apple Certified', 'Samsung Certified', 'Board-Level Repair'],
    stats: {
      ticketsCompleted: 45,
      averageTime: 2.1,
      customerRating: 4.9,
      warrantyClaimRate: 1.2,
      revenue: 4250,
    },
    workingHours: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: null,
    },
    status: 'working',
    currentWorkload: 3,
    maxWorkload: 6,
  },
  {
    id: 'staff_2',
    firstName: 'Ava',
    lastName: 'Chen',
    email: 'ava@icenter.com',
    phone: '(512) 555-0101',
    role: 'technician',
    permissions: ['tickets', 'inventory', 'customers'],
    startDate: new Date('2022-03-10'),
    hourlyRate: 22,
    isActive: true,
    specializations: ['iPhone', 'Samsung', 'Game Consoles'],
    certifications: ['Apple Certified'],
    stats: {
      ticketsCompleted: 38,
      averageTime: 2.3,
      customerRating: 4.8,
      warrantyClaimRate: 2.1,
      revenue: 3420,
    },
    workingHours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: null,
      sunday: null,
    },
    status: 'working',
    currentWorkload: 4,
    maxWorkload: 6,
  },
  {
    id: 'staff_3',
    firstName: 'Noah',
    lastName: 'Kim',
    email: 'noah@icenter.com',
    phone: '(512) 555-0102',
    role: 'technician',
    permissions: ['tickets', 'inventory', 'customers'],
    startDate: new Date('2021-08-22'),
    hourlyRate: 25,
    isActive: true,
    specializations: ['Android', 'Laptops', 'Water Damage', 'Data Recovery'],
    certifications: ['CompTIA A+', 'Water Damage Specialist'],
    stats: {
      ticketsCompleted: 32,
      averageTime: 2.8,
      customerRating: 4.5,
      warrantyClaimRate: 3.5,
      revenue: 2890,
    },
    workingHours: {
      monday: { start: '10:00', end: '18:00' },
      tuesday: { start: '10:00', end: '18:00' },
      wednesday: { start: '10:00', end: '18:00' },
      thursday: { start: '10:00', end: '18:00' },
      friday: { start: '10:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: null,
    },
    status: 'break',
    currentWorkload: 5,
    maxWorkload: 6,
  },
  {
    id: 'staff_4',
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia@icenter.com',
    phone: '(512) 555-0103',
    role: 'front-desk',
    permissions: ['tickets', 'customers', 'payments'],
    startDate: new Date('2023-01-05'),
    hourlyRate: 18,
    isActive: true,
    specializations: ['Customer Service', 'Sales'],
    certifications: [],
    stats: {
      ticketsCompleted: 0,
      averageTime: 0,
      customerRating: 4.7,
      warrantyClaimRate: 0,
      revenue: 8500, // Sales
    },
    workingHours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '14:00' },
      sunday: null,
    },
    status: 'working',
    currentWorkload: 8,
    maxWorkload: 10,
  },
  {
    id: 'staff_5',
    firstName: 'Jae',
    lastName: 'Park',
    email: 'jae@icenter.com',
    phone: '(512) 555-0104',
    role: 'technician',
    permissions: ['tickets', 'inventory', 'customers'],
    startDate: new Date('2022-11-15'),
    hourlyRate: 20,
    isActive: false,
    specializations: ['iPhone', 'iPad', 'MacBook'],
    certifications: ['Apple Certified'],
    stats: {
      ticketsCompleted: 28,
      averageTime: 2.2,
      customerRating: 4.8,
      warrantyClaimRate: 1.8,
      revenue: 2650,
    },
    workingHours: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: null,
      sunday: null,
    },
    status: 'off',
    currentWorkload: 0,
    maxWorkload: 6,
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
  { action: 'Process payments', owner: true, manager: true, technician: false, frontDesk: true },
]

const specializationIcons: Record<string, React.ReactNode> = {
  'iPhone': <Smartphone className="w-3 h-3" />,
  'Samsung': <Smartphone className="w-3 h-3" />,
  'Android': <Smartphone className="w-3 h-3" />,
  'iPad': <Tablet className="w-3 h-3" />,
  'MacBook': <Laptop className="w-3 h-3" />,
  'Laptops': <Laptop className="w-3 h-3" />,
  'Game Consoles': <Gamepad2 className="w-3 h-3" />,
  'Microsoldering': <Wrench className="w-3 h-3" />,
  'Water Damage': <Activity className="w-3 h-3" />,
  'Data Recovery': <Activity className="w-3 h-3" />,
  'Customer Service': <User className="w-3 h-3" />,
  'Sales': <DollarSign className="w-3 h-3" />,
}

export function StaffClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [tab, setTab] = useState<'all' | 'technicians' | 'front-desk' | 'schedule'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff)

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff')
      if (!res.ok) {
        // Fallback to mock data on error
        setStaffList(mockStaff)
        return
      }
      const data = await res.json()
      // Map API data to StaffMember format, merging with mock defaults
      const mapped: StaffMember[] = data.map((s: any) => {
        const mock = mockStaff.find((m) => m.email === s.email) || mockStaff[0]
        return {
          ...mock,
          id: s.id,
          firstName: s.name.split(' ')[0] || s.name,
          lastName: s.name.split(' ').slice(1).join(' ') || '',
          email: s.email,
          role: s.role,
          pin: s.pin,
          isActive: s.isActive,
          stats: {
            ...mock.stats,
            ticketsCompleted: s.stats?.ticketsCompleted || 0,
          },
        }
      })
      if (mapped.length > 0) {
        setStaffList(mapped)
      }
    } catch {
      // Keep mock data on error
    }
  }, [])

  useEffect(() => {
    fetchStaff().then(() => {
      setLoading(false)
      setTimeout(() => setAnimationReady(true), 100)
    })
  }, [fetchStaff])

  const filteredStaff = useMemo(() => {
    let result = staffList

    if (tab === 'technicians') result = result.filter(s => s.role === 'technician')
    if (tab === 'front-desk') result = result.filter(s => s.role === 'front-desk')

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.specializations.some(sp => sp.toLowerCase().includes(q))
      )
    }

    return result
  }, [tab, searchQuery, staffList])

  const teamStats = useMemo(() => {
    const technicians = staffList.filter(s => s.role === 'technician' && s.isActive)
    const totalTickets = technicians.reduce((sum, s) => sum + s.stats.ticketsCompleted, 0)
    const totalRevenue = staffList.reduce((sum, s) => sum + s.stats.revenue, 0)
    const avgRating = technicians.length > 0
      ? technicians.reduce((sum, s) => sum + s.stats.customerRating, 0) / technicians.length
      : 0
    const activeNow = staffList.filter(s => s.status === 'working').length

    return [
      { label: 'Active Now', value: activeNow, sub: `${staffList.length} total`, icon: <UserCheck className="w-5 h-5" />, color: 'emerald' },
      { label: 'Total Tickets', value: totalTickets, sub: 'this month', icon: <Target className="w-5 h-5" />, color: 'purple' },
      { label: 'Team Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'this month', icon: <DollarSign className="w-5 h-5" />, color: 'blue' },
      { label: 'Avg Rating', value: avgRating.toFixed(1), sub: 'customer score', icon: <Star className="w-5 h-5" />, color: 'amber' },
    ]
  }, [staffList])

  const performanceData = useMemo(() => {
    return staffList
      .filter(s => s.role === 'technician' && s.isActive)
      .map(s => ({
        name: s.firstName,
        tickets: s.stats.ticketsCompleted,
        revenue: s.stats.revenue,
        rating: s.stats.customerRating,
      }))
      .sort((a, b) => b.tickets - a.tickets)
  }, [staffList])

  const handleAddStaff = async (name: string, email: string, role: string) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role: role.toUpperCase().replace('-', '_') }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to add staff')
        return
      }
      toast.success('Staff member added')
      setAddOpen(false)
      fetchStaff()
    } catch {
      toast.error('Failed to add staff')
    }
  }

  const handleDeactivateStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to deactivate staff')
        return
      }
      toast.success('Staff member deactivated')
      setSelectedStaff(null)
      fetchStaff()
    } catch {
      toast.error('Failed to deactivate staff')
    }
  }

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'manager':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      case 'technician':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'front-desk':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      default:
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'break':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'off':
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
      default:
        return 'bg-white/5 text-[var(--text-muted)] border-white/10'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff" description="Loading..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-page-in">
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Staff"
          description="Team management, workload tracking, and performance metrics."
          action={
            <button
              onClick={() => setAddOpen(true)}
              className={cn(
                "group relative px-5 py-3 rounded-xl inline-flex items-center gap-2",
                "text-sm font-semibold text-white",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              )}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          }
        />
      </div>

      {/* Stats Grid */}
      <div className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {teamStats.map((stat) => (
          <GlassCard
            key={stat.label}
            className={cn(
              'p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group',
              stat.color === 'emerald' && 'border-emerald-500/20',
              stat.color === 'purple' && 'border-purple-500/20',
              stat.color === 'blue' && 'border-blue-500/20',
              stat.color === 'amber' && 'border-amber-500/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'p-2.5 rounded-xl',
                  stat.color === 'emerald' && 'bg-emerald-500/15 text-emerald-400',
                  stat.color === 'purple' && 'bg-purple-500/15 text-purple-400',
                  stat.color === 'blue' && 'bg-blue-500/15 text-blue-400',
                  stat.color === 'amber' && 'bg-amber-500/15 text-amber-400'
                )}
              >
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-3">{stat.label}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{stat.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Today's Team Status */}
      <GlassCard className="rounded-3xl">
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">Today's Team</div>
        <div className="flex flex-wrap gap-3">
          {staffList.filter(s => s.isActive).map((staff) => (
            <div
              key={staff.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all',
                staff.status === 'working' && 'bg-emerald-500/[0.08] border-emerald-500/20',
                staff.status === 'break' && 'bg-amber-500/[0.08] border-amber-500/20',
                staff.status === 'off' && 'bg-white/[0.03] border-white/10'
              )}
              onClick={() => setSelectedStaff(staff)}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-semibold">
                  {staff.firstName[0]}{staff.lastName[0]}
                </div>
                <div className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-page)]',
                  staff.status === 'working' && 'bg-emerald-400',
                  staff.status === 'break' && 'bg-amber-400',
                  staff.status === 'off' && 'bg-gray-400'
                )} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{staff.firstName}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {staff.role === 'front-desk' ? 'Front Desk' : staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                </div>
              </div>
              {staff.role === 'technician' && staff.status === 'working' && (
                <div className="text-xs text-[var(--text-muted)]">
                  {staff.currentWorkload} active
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Staff Directory */}
        <GlassCard className="p-0 rounded-3xl lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-[var(--border-default)]">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as any)}
              tabs={[
                { value: 'all', label: `All (${staffList.length})` },
                { value: 'technicians', label: `Technicians (${staffList.filter(s => s.role === 'technician').length})` },
                { value: 'front-desk', label: 'Front Desk' },
                { value: 'schedule', label: 'Schedule' },
              ]}
            />
          </div>

          <div className="p-4 border-b border-[var(--border-default)]">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="Search by name, email, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {tab === 'schedule' ? (
            <div className="p-5">
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">Weekly Schedule</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[var(--text-muted)]">
                        <th className="pb-2 pr-4">Staff</th>
                        <th className="pb-2 px-2 text-center">Mon</th>
                        <th className="pb-2 px-2 text-center">Tue</th>
                        <th className="pb-2 px-2 text-center">Wed</th>
                        <th className="pb-2 px-2 text-center">Thu</th>
                        <th className="pb-2 px-2 text-center">Fri</th>
                        <th className="pb-2 px-2 text-center">Sat</th>
                        <th className="pb-2 px-2 text-center">Sun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.filter(s => s.isActive).map((staff) => (
                        <tr key={staff.id} className="border-t border-white/[0.04]">
                          <td className="py-2 pr-4 text-[var(--text-primary)] font-medium">{staff.firstName}</td>
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                            const hours = staff.workingHours[day as keyof typeof staff.workingHours]
                            return (
                              <td key={day} className="py-2 px-2 text-center">
                                {hours ? (
                                  <span className="text-emerald-400">{hours.start.slice(0, 5)}</span>
                                ) : (
                                  <span className="text-[var(--text-muted)]">—</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={cn(
                    'p-4 hover:bg-white/[0.02] transition-colors cursor-pointer',
                    !staff.isActive && 'opacity-60'
                  )}
                  onClick={() => setSelectedStaff(staff)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </div>
                      {staff.isActive && (
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-page)]',
                          staff.status === 'working' && 'bg-emerald-400',
                          staff.status === 'break' && 'bg-amber-400',
                          staff.status === 'off' && 'bg-gray-400'
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {staff.firstName} {staff.lastName}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-semibold border capitalize', getRoleStyles(staff.role))}>
                          {staff.role === 'front-desk' ? 'Front Desk' : staff.role}
                        </span>
                        {!staff.isActive && (
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[var(--text-muted)] text-[10px] font-semibold border border-white/10">
                            On Leave
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {staff.email} • {staff.phone}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {staff.specializations.slice(0, 4).map((spec) => (
                          <span key={spec} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-[var(--text-secondary)]">
                            {specializationIcons[spec] || <Wrench className="w-3 h-3" />}
                            {spec}
                          </span>
                        ))}
                        {staff.specializations.length > 4 && (
                          <span className="text-[10px] text-[var(--text-muted)]">+{staff.specializations.length - 4} more</span>
                        )}
                      </div>
                      {staff.role === 'technician' && staff.isActive && (
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Target className="w-3 h-3 text-purple-400" />
                            {staff.stats.ticketsCompleted} tickets
                          </div>
                          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Timer className="w-3 h-3 text-blue-400" />
                            {staff.stats.averageTime}h avg
                          </div>
                          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <Star className="w-3 h-3 text-amber-400" />
                            {staff.stats.customerRating}
                          </div>
                          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            ${staff.stats.revenue.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {staff.role === 'technician' && staff.isActive && (
                        <TechLoadRing
                          name=""
                          assigned={staff.currentWorkload}
                          max={staff.maxWorkload}
                          color={staff.currentWorkload >= staff.maxWorkload * 0.8 ? 'red' : 'purple'}
                        />
                      )}
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Side Panel */}
        <div className="space-y-4">
          {selectedStaff ? (
            <GlassCard className="rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)]">Staff Details</div>
                <button
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  onClick={() => setSelectedStaff(null)}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-semibold">
                    {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </div>
                    <div className={cn('inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize mt-1', getRoleStyles(selectedStaff.role))}>
                      {selectedStaff.role === 'front-desk' ? 'Front Desk' : selectedStaff.role}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                    {selectedStaff.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                    {selectedStaff.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    Started {selectedStaff.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {selectedStaff.specializations.length > 0 && (
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Specializations</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStaff.specializations.map((spec) => (
                        <span key={spec} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                          {specializationIcons[spec] || <Wrench className="w-3 h-3" />}
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStaff.certifications.length > 0 && (
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Certifications</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStaff.certifications.map((cert) => (
                        <span key={cert} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                          <BadgeCheck className="w-3 h-3" />
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStaff.role === 'technician' && (
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">This Month</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                        <div className="text-xs text-[var(--text-muted)]">Tickets</div>
                        <div className="text-lg font-bold text-[var(--text-primary)] mt-1">{selectedStaff.stats.ticketsCompleted}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                        <div className="text-xs text-[var(--text-muted)]">Revenue</div>
                        <div className="text-lg font-bold text-emerald-400 mt-1">${selectedStaff.stats.revenue.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                        <div className="text-xs text-[var(--text-muted)]">Avg Time</div>
                        <div className="text-lg font-bold text-[var(--text-primary)] mt-1">{selectedStaff.stats.averageTime}h</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                        <div className="text-xs text-[var(--text-muted)]">Rating</div>
                        <div className="text-lg font-bold text-amber-400 mt-1">⭐ {selectedStaff.stats.customerRating}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button className="btn-secondary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="btn-secondary px-4 py-2.5 rounded-xl flex-1 flex items-center justify-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    Schedule
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Performance Chart */}
              <GlassCard className="rounded-3xl p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-default)]">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Performance</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Tickets completed this month</div>
                </div>
                <div className="h-[180px] px-2 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} layout="vertical" margin={{ left: 40, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis type="number" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,10,15,0.95)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          borderRadius: 12,
                          color: 'white',
                        }}
                        formatter={(value: number) => [`${value} tickets`, 'Completed']}
                      />
                      <Bar dataKey="tickets" fill="rgba(167,139,250,0.6)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Permissions Matrix */}
              <GlassCard className="rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <div className="text-sm font-semibold text-[var(--text-primary)]">Role Permissions</div>
                </div>
                <div className="space-y-3">
                  {permissions.slice(0, 5).map((perm) => (
                    <div key={perm.action} className="rounded-2xl bg-white/[0.03] border border-[var(--border-default)] p-3">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{perm.action}</div>
                      <div className="grid grid-cols-4 gap-2">
                        {(['owner', 'manager', 'technician', 'frontDesk'] as const).map((role) => (
                          <div
                            key={role}
                            className={cn(
                              'text-center py-1 rounded-lg text-[10px] font-semibold',
                              perm[role]
                                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                : 'bg-white/5 text-[var(--text-primary)]/30 border border-[var(--border-default)]'
                            )}
                          >
                            {perm[role] ? '✓' : '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  View all permissions →
                </button>
              </GlassCard>
            </>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Staff Member"
        description="Create a new team member profile."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="john@example.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="(512) 555-0100" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="select bg-[var(--bg-input)] border-[var(--border-default)]">
              <option value="technician">Technician</option>
              <option value="front-desk">Front Desk</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label className="label">Specializations</label>
            <input className="input bg-[var(--bg-input)] border-[var(--border-default)]" placeholder="iPhone, Samsung, etc." />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary px-4 py-3 rounded-xl flex-1" onClick={() => setAddOpen(false)}>
              Add Staff
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

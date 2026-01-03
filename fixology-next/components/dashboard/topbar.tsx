'use client'

// components/dashboard/topbar.tsx
// Global dashboard top bar with enhanced animations and effects

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { CommandPalette } from './command-palette'
import { Modal } from '@/components/dashboard/ui/modal'
import { StateBanner } from '@/components/dashboard/ui/state-banner'
import { useActor } from '@/contexts/actor-context'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Ticket,
  UserPlus,
  PackagePlus,
  Stethoscope,
  User,
  Building2,
  Settings,
  Monitor,
  Wrench,
  Crown,
  Sun,
  Moon,
  Check,
  CheckCheck,
  X,
  Clock,
  Package,
  Sparkles,
  Command,
} from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

type TopBarProps = {
  user?: { name: string; email: string; role: string }
  shop?: { name: string; plan: string; city?: string; state?: string }
}

function initials(name?: string) {
  const n = (name || 'User').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || 'U'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
}

// Initial notifications data
const INITIAL_NOTIFICATIONS = [
  { 
    id: 1, 
    title: '2 tickets are past promised time', 
    desc: 'Review the "Ready" column to prevent delays.',
    icon: 'clock',
    read: false,
    time: '5m ago',
  },
  { 
    id: 2, 
    title: 'Low stock: iPhone 14 Pro screen', 
    desc: 'Only 2 left. Reorder suggestion is ready.',
    icon: 'package',
    read: false,
    time: '15m ago',
  },
  { 
    id: 3, 
    title: 'Customer reply received', 
    desc: '"Can you confirm the price?" from John D.',
    icon: 'message',
    read: false,
    time: '1h ago',
  },
  { 
    id: 4, 
    title: 'New 5-star review!', 
    desc: '"Amazing service, fixed my phone in 30 min!" - Sarah M.',
    icon: 'star',
    read: true,
    time: '2h ago',
  },
  { 
    id: 5, 
    title: 'Payment received: $219', 
    desc: 'Ticket #1048 marked as paid.',
    icon: 'payment',
    read: true,
    time: '3h ago',
  },
]

type Notification = typeof INITIAL_NOTIFICATIONS[0]

export function TopBar({ user, shop }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { actor, staff, verifyPin, setActiveActor } = useActor()
  const { resolvedTheme, toggleTheme } = useTheme()
  const [searchFocused, setSearchFocused] = useState(false)
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (icon: string) => {
    switch (icon) {
      case 'clock': return <Clock className="w-4 h-4 text-amber-400" />
      case 'package': return <Package className="w-4 h-4 text-rose-400" />
      case 'message': return <span className="text-sm">💬</span>
      case 'star': return <span className="text-sm">⭐</span>
      case 'payment': return <span className="text-sm">💰</span>
      default: return <Bell className="w-4 h-4 text-purple-400" />
    }
  }

  const isDashboardHome = pathname === '/dashboard'

  const [switchOpen, setSwitchOpen] = useState(false)
  const [switchTarget, setSwitchTarget] = useState<'TECHNICIAN' | 'FRONT_DESK'>('TECHNICIAN')
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const pinRef = useRef<HTMLInputElement | null>(null)

  const owner = useMemo(() => staff.find((m) => m.role === 'OWNER') || staff[0], [staff])
  const techs = useMemo(() => staff.filter((m) => m.role === 'TECHNICIAN'), [staff])
  const frontDesk = useMemo(() => staff.filter((m) => m.role === 'FRONT_DESK'), [staff])

  const openTechSwitch = () => {
    setSwitchTarget('TECHNICIAN')
    setSwitchOpen(true)
  }
  const openFrontDeskSwitch = () => {
    setSwitchTarget('FRONT_DESK')
    setSwitchOpen(true)
  }
  const openOwnerPin = () => {
    setPendingId(owner?.id || 'owner')
    setPinError(null)
    setPinOpen(true)
    setTimeout(() => pinRef.current?.focus(), 50)
  }

  const beginPinFor = (id: string) => {
    setPendingId(id)
    setPinError(null)
    setPinOpen(true)
    setTimeout(() => pinRef.current?.focus(), 50)
  }

  const submitPin = () => {
    if (!pendingId) return
    const raw = pinRef.current?.value || ''
    const clean = raw.replace(/\D/g, '').slice(0, 6)
    if (clean.length !== 6) {
      setPinError('Enter the 6-digit PIN.')
      return
    }
    if (!verifyPin(pendingId, clean)) {
      setPinError('Incorrect PIN. Try again.')
      return
    }
    setActiveActor(pendingId)
    setPinOpen(false)
    setSwitchOpen(false)
    setPinError(null)
    if (pinRef.current) pinRef.current.value = ''
  }

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const crumbs = useMemo(() => {
    const seg = pathname.split('?')[0].split('/').filter(Boolean)
    if (seg.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }]
    const primary = seg[0]
    const labelMap: Record<string, string> = {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      customers: 'Customers',
      inventory: 'Inventory',
      diagnostics: 'Diagnostics',
      invoices: 'Invoices',
      reports: 'Reports',
      settings: 'Settings',
      support: 'Support',
    }
    return [{ label: labelMap[primary] || 'Dashboard', href: `/${primary}` }]
  }, [pathname])

  const handleLogout = async () => {
    try {
      document.cookie = 'fx_demo=; path=/; max-age=0; samesite=lax'
    } catch {}
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30">
      <div
        className={cn(
          'border-b border-white/[0.06] backdrop-blur-2xl',
          'transition-all duration-300'
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 14, 0.95) 0%, rgba(7, 7, 10, 0.92) 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Left: breadcrumbs + subtle context */}
            <div className="min-w-0 flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/50">
                {crumbs.map((c, i) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className={cn(
                      'hover:text-white transition-all duration-200',
                      'hover:translate-x-0.5'
                    )}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
              {shop?.name && (
                <div className="hidden md:flex items-center gap-2 text-xs text-white/40">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[220px]">{shop.name}</span>
                </div>
              )}
            </div>

            {/* Center: search */}
            <div className="flex-1 max-w-[560px]">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                onMouseEnter={() => setSearchFocused(true)}
                onMouseLeave={() => setSearchFocused(false)}
                className={cn(
                  'group w-full relative flex items-center gap-3 px-4 py-2.5 rounded-xl',
                  'bg-white/[0.03] border border-white/[0.08]',
                  'transition-all duration-300 ease-out',
                  'text-left text-sm text-white/60',
                  'hover:bg-white/[0.05] hover:border-white/[0.15]'
                )}
                style={{
                  boxShadow: searchFocused
                    ? '0 0 0 2px rgba(139, 92, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.2)'
                    : 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
                }}
              >
                <Search
                  className={cn(
                    'w-4 h-4 flex-shrink-0 transition-all duration-300',
                    searchFocused ? 'text-purple-400' : 'text-white/40'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 group-hover:text-white/70 transition-colors">
                  Search ticket #, phone, IMEI, device…
                </span>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08]',
                    'text-[10px] font-medium text-white/40',
                    'transition-all duration-300',
                    'group-hover:bg-white/[0.06] group-hover:text-white/50'
                  )}
                >
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div
                className={cn(
                  'hidden lg:flex items-center gap-1 rounded-xl p-1',
                  'bg-white/[0.03] border border-white/[0.08]'
                )}
              >
                {[
                  { role: 'FRONT_DESK', icon: Monitor, label: 'Front Desk', onClick: openFrontDeskSwitch },
                  { role: 'TECHNICIAN', icon: Wrench, label: 'Tech', onClick: openTechSwitch },
                  { role: 'OWNER', icon: Crown, label: 'Owner', onClick: openOwnerPin },
                ].map(({ role, icon: Icon, label, onClick }) => (
                  <button
                    key={role}
                    onClick={onClick}
                    className={cn(
                      'group relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300',
                      actor.role === role
                        ? 'text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                    )}
                    title={`${label} Mode`}
                  >
                    {/* Active background */}
                    {actor.role === role && (
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          boxShadow: '0 0 12px rgba(139, 92, 246, 0.2)',
                        }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {/* New dropdown */}
              {!isDashboardHome && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className={cn(
                        'group relative px-4 py-2.5 rounded-xl inline-flex items-center gap-2',
                        'text-sm font-semibold text-white',
                        'transition-all duration-300 ease-out',
                        'hover:scale-[1.02] active:scale-[0.98]'
                      )}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                        backgroundSize: '200% 200%',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">New</span>
                      <ChevronDown className="w-4 h-4 opacity-80" aria-hidden="true" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className={cn(
                        'z-[60] w-64 p-2 rounded-2xl overflow-hidden',
                        'backdrop-blur-2xl border border-white/[0.08]',
                        'animate-scale-in'
                      )}
                      style={{
                        background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      {[
                        { icon: Ticket, label: 'New Ticket', href: '/tickets/new' },
                        { icon: UserPlus, label: 'New Customer', href: '/customers/new' },
                        { icon: PackagePlus, label: 'Add Inventory', href: '/inventory?add=1' },
                        { icon: Stethoscope, label: 'Run Diagnostic', href: '/diagnostics?new=1' },
                      ].map(({ icon: Icon, label, href }, i) => (
                        <DropdownMenu.Item
                          key={href}
                          className={cn(
                            'group outline-none cursor-pointer rounded-xl px-3 py-2.5',
                            'text-sm text-white/70 flex items-center gap-3',
                            'transition-all duration-200',
                            'hover:bg-white/[0.06] hover:text-white'
                          )}
                          style={{ animationDelay: `${i * 50}ms` }}
                          onSelect={() => router.push(href)}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              'bg-purple-500/10 border border-purple-500/20',
                              'group-hover:bg-purple-500/20 group-hover:border-purple-500/30',
                              'transition-all duration-200'
                            )}
                          >
                            <Icon className="w-4 h-4 text-purple-300" aria-hidden="true" />
                          </div>
                          {label}
                        </DropdownMenu.Item>
                      ))}
                      <DropdownMenu.Separator className="h-px bg-white/[0.06] my-2" />
                      <div className="px-3 pb-2 pt-1 text-[10px] text-white/35 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Actions are UI-only for now
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              )}

              {/* Notifications */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={cn(
                      'group relative p-2.5 rounded-xl',
                      'bg-white/[0.03] border border-white/[0.08]',
                      'transition-all duration-300',
                      'hover:bg-white/[0.06] hover:border-white/[0.12]'
                    )}
                  >
                    <Bell
                      className={cn(
                        'w-4 h-4 text-white/60 transition-all duration-300',
                        'group-hover:text-white group-hover:scale-105'
                      )}
                      aria-hidden="true"
                    />
                    {unreadCount > 0 && (
                      <span
                        className={cn(
                          'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full',
                          'flex items-center justify-center',
                          'text-[10px] font-bold text-white',
                          'animate-scale-in'
                        )}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)',
                          boxShadow: '0 0 12px rgba(239, 68, 68, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                        aria-hidden="true"
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className={cn(
                      'z-[60] w-[380px] rounded-2xl overflow-hidden',
                      'backdrop-blur-2xl border border-white/[0.08]',
                      'animate-scale-in'
                    )}
                    style={{
                      background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
                      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-semibold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                            }}
                          >
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            markAllAsRead()
                          }}
                          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center animate-fade-in-up">
                          <div
                            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                            }}
                          >
                            <Bell className="w-5 h-5 text-purple-300 opacity-50" />
                          </div>
                          <div className="text-sm text-white/60">No notifications</div>
                          <div className="text-xs text-white/30 mt-1">You're all caught up!</div>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.04]">
                          {notifications.map((n, i) => (
                            <div
                              key={n.id}
                              className={cn(
                                'group relative px-4 py-3 transition-all duration-200',
                                n.read
                                  ? 'bg-transparent hover:bg-white/[0.03]'
                                  : 'bg-purple-500/[0.03] hover:bg-purple-500/[0.06]'
                              )}
                              style={{ animationDelay: `${i * 30}ms` }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div
                                  className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                    'transition-all duration-200',
                                    n.read
                                      ? 'bg-white/[0.04]'
                                      : 'bg-purple-500/10 border border-purple-500/20'
                                  )}
                                >
                                  {getNotificationIcon(n.icon)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div
                                      className={cn(
                                        'text-sm font-medium truncate',
                                        n.read ? 'text-white/60' : 'text-white'
                                      )}
                                    >
                                      {n.title}
                                    </div>
                                    {!n.read && (
                                      <span
                                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5 animate-breathe"
                                        style={{
                                          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                          boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                    {n.desc}
                                  </div>
                                  <div className="text-[10px] text-white/25 mt-1.5">{n.time}</div>
                                </div>

                                {/* Actions (visible on hover) */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  {!n.read && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        markAsRead(n.id)
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-emerald-400 transition-all duration-200"
                                      title="Mark as read"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      dismissNotification(n.id)
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-rose-400 transition-all duration-200"
                                    title="Dismiss"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                        <button
                          onClick={() => router.push('/notifications')}
                          className="w-full text-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          View all notifications →
                        </button>
                      </div>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* User menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={cn(
                      'group relative px-3 py-2 rounded-xl inline-flex items-center gap-2',
                      'bg-white/[0.03] border border-white/[0.08]',
                      'transition-all duration-300',
                      'hover:bg-white/[0.06] hover:border-white/[0.12]'
                    )}
                  >
                    <div
                      className={cn(
                        'relative w-8 h-8 rounded-lg flex items-center justify-center',
                        'text-white text-sm font-semibold',
                        'transition-all duration-300',
                        'group-hover:scale-105'
                      )}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      {initials(actor?.name || user?.name)}
                      {/* Online indicator */}
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          borderColor: 'rgb(var(--bg-secondary))',
                          background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                          boxShadow: '0 0 6px rgba(74, 222, 128, 0.5)',
                        }}
                      />
                    </div>
                    <div className="hidden lg:flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold text-white max-w-[140px] truncate">
                        {actor?.name || user?.name || 'Demo User'}
                      </span>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">
                        {actor?.role || user?.role || 'Owner'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/40 hidden lg:block group-hover:text-white/60 transition-colors" aria-hidden="true" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className={cn(
                      'z-[60] w-72 p-2 rounded-2xl overflow-hidden',
                      'backdrop-blur-2xl border border-white/[0.08]',
                      'animate-scale-in'
                    )}
                    style={{
                      background: 'linear-gradient(180deg, rgba(15, 15, 20, 0.98) 0%, rgba(10, 10, 14, 0.98) 100%)',
                      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="px-3 py-3">
                      <div className="text-sm font-semibold text-white">{user?.name || 'Demo User'}</div>
                      <div className="text-xs text-white/40 mt-0.5">{user?.email || 'demo@fixology.local'}</div>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1" />

                    {/* Role badge */}
                    <div className="px-3 py-2">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                        }}
                      >
                        <Crown className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                          {actor?.role || user?.role || 'Owner'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1" />

                    {[
                      { icon: User, label: 'Profile', href: '/settings?tab=profile' },
                      { icon: Building2, label: 'Workspace', href: '/settings?tab=shop' },
                      { icon: Settings, label: 'Settings', href: '/settings' },
                    ].map(({ icon: Icon, label, href }) => (
                      <DropdownMenu.Item
                        key={href}
                        className={cn(
                          'group outline-none cursor-pointer rounded-xl px-3 py-2.5',
                          'text-sm text-white/70 flex items-center gap-3',
                          'transition-all duration-200',
                          'hover:bg-white/[0.04] hover:text-white'
                        )}
                        onSelect={() => router.push(href)}
                      >
                        <Icon className="w-4 h-4 text-purple-300/70 group-hover:text-purple-300 transition-colors" aria-hidden="true" />
                        {label}
                      </DropdownMenu.Item>
                    ))}

                    <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1" />

                    {/* Theme Toggle */}
                    <DropdownMenu.Item
                      className={cn(
                        'outline-none cursor-pointer rounded-xl px-3 py-2.5',
                        'text-sm text-white/70 flex items-center justify-between',
                        'transition-all duration-200',
                        'hover:bg-white/[0.04] hover:text-white'
                      )}
                      onSelect={(e) => {
                        e.preventDefault()
                        toggleTheme()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {resolvedTheme === 'dark' ? (
                          <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ) : (
                          <Moon className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                        )}
                        {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </div>
                      <div
                        className={cn(
                          'w-10 h-5 rounded-full relative transition-all duration-300',
                          resolvedTheme === 'light' ? 'bg-purple-500' : 'bg-white/15'
                        )}
                        style={{
                          boxShadow: resolvedTheme === 'light'
                            ? '0 0 12px rgba(139, 92, 246, 0.4)'
                            : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-lg transition-transform duration-300',
                            resolvedTheme === 'light' ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </div>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1" />

                    <DropdownMenu.Item
                      className={cn(
                        'outline-none cursor-pointer rounded-xl px-3 py-2.5',
                        'text-sm text-white/70 flex items-center gap-3',
                        'transition-all duration-200',
                        'hover:bg-red-500/10 hover:text-red-400'
                      )}
                      onSelect={handleLogout}
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Switch: pick staff member */}
      <Modal
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        title={switchTarget === 'TECHNICIAN' ? 'Select technician' : 'Select front desk'}
        description="UI-only identity switch. Pick your name to keep actions accountable."
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            {(switchTarget === 'TECHNICIAN' ? techs : frontDesk).map((m, i) => (
              <button
                key={m.id}
                onClick={() => {
                  if (m.role === 'TECHNICIAN') {
                    beginPinFor(m.id)
                  } else {
                    setActiveActor(m.id)
                    setSwitchOpen(false)
                  }
                }}
                className={cn(
                  'group w-full text-left rounded-2xl border px-4 py-3.5',
                  'transition-all duration-300',
                  'bg-white/[0.02] border-white/[0.08]',
                  'hover:bg-white/[0.05] hover:border-purple-500/30',
                  'hover:translate-x-1',
                  actor.id === m.id && 'bg-purple-500/10 border-purple-400/30'
                )}
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'text-white text-sm font-semibold',
                        'transition-all duration-300',
                        'group-hover:scale-105'
                      )}
                      style={{
                        background: actor.id === m.id
                          ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
                          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        boxShadow: actor.id === m.id
                          ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                          : 'none',
                      }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/90">{m.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">{m.role.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-medium px-2 py-1 rounded-lg',
                      m.role === 'TECHNICIAN'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    )}
                  >
                    {m.role === 'TECHNICIAN' ? 'PIN required' : 'Fast switch'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-white/35 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Tech mode uses a 6‑digit PIN per person. Owner mode is always PIN‑gated.
          </div>
        </div>
      </Modal>

      {/* PIN modal */}
      <Modal
        open={pinOpen}
        onOpenChange={(o) => {
          setPinOpen(o)
          if (!o) {
            setPinError(null)
            setPendingId(null)
            if (pinRef.current) pinRef.current.value = ''
          }
        }}
        title="Enter PIN"
        description="6-digit PIN for this user (UI-only)."
        className="max-w-md"
      >
        <div className="space-y-5">
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Signing in as</div>
            <div className="text-sm font-semibold text-white mt-1">
              {staff.find((s) => s.id === pendingId)?.name || 'User'}
            </div>
          </div>

          <div>
            <label className="label text-xs text-white/50 uppercase tracking-wider">6-digit PIN</label>
            <input
              ref={pinRef}
              onChange={() => setPinError(null)}
              inputMode="numeric"
              autoComplete="one-time-code"
              className={cn(
                'input bg-white/[0.03] border-white/[0.08]',
                'tracking-[0.5em] text-center text-xl font-semibold',
                'focus:border-purple-500/50 focus:bg-white/[0.05]'
              )}
              style={{
                letterSpacing: '0.5em',
              }}
              placeholder="••••••"
            />
          </div>

          {pinError && <StateBanner type="outdated" message={pinError} />}

          <div className="flex items-center gap-2">
            <ButtonSecondary className="px-4 py-3 rounded-xl flex-1" onClick={() => setPinOpen(false)}>
              Cancel
            </ButtonSecondary>
            <button className="btn-primary px-4 py-3 rounded-xl flex-1" onClick={submitPin}>
              Unlock
            </button>
          </div>

          <div className="text-[10px] text-white/30 text-center">
            PINs are stored locally for this demo
          </div>
        </div>
      </Modal>
    </header>
  )
}

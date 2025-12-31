'use client'

// components/dashboard/sidebar.tsx
// Dashboard sidebar navigation with hover-based toggle

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { FixologyLogo } from '@/components/shared/fixology-logo'
import { ReticleIcon } from '@/components/shared/reticle-icon'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Package,
  FileText,
  BarChart3,
  Settings,
  Stethoscope,
  LifeBuoy,
  LogOut,
  Building2,
  Calendar,
  UserCheck,
  History,
  Smartphone,
  DollarSign,
  MessageSquare,
  Shield,
  AlertTriangle,
  FileCheck,
  FileCode,
  GraduationCap,
  Plug,
  TrendingUp,
  HelpCircle,
  Cpu,
  CreditCard,
  ClipboardList,
  Brain,
  Activity,
  Clock4,
  LockKeyhole,
  MonitorDot,
  Banknote,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  emoji?: string
  badge?: number | string
}

const coreNavItems: NavItem[] = [
  { emoji: '📊', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { emoji: '🎫', label: 'Tickets', href: '/tickets', icon: <Ticket className="w-5 h-5" /> },
  { emoji: '👥', label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { emoji: '📱', label: 'Devices', href: '/devices', icon: <Smartphone className="w-5 h-5" /> },
  { emoji: '📦', label: 'Inventory', href: '/inventory', icon: <Package className="w-5 h-5" /> },
  { emoji: '🩺', label: 'Diagnostics', href: '/diagnostics', icon: <Stethoscope className="w-5 h-5" /> },
]

const businessNavItems: NavItem[] = [
  { emoji: '🧾', label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
  { emoji: '💳', label: 'Payments', href: '/payments', icon: <CreditCard className="w-5 h-5" /> },
  { emoji: '💸', label: 'Payouts', href: '/payouts', icon: <Banknote className="w-5 h-5" /> },
  { emoji: '🧮', label: 'Estimates', href: '/estimates', icon: <ClipboardList className="w-5 h-5" /> },
  { emoji: '🔄', label: 'Warranty & Returns', href: '/warranty', icon: <Shield className="w-5 h-5" /> },
]

const intelligenceNavItems: NavItem[] = [
  { emoji: '📈', label: 'Insights', href: '/insights', icon: <BarChart3 className="w-5 h-5" /> },
  { emoji: '⚠️', label: 'Risk Monitor', href: '/risk-monitor', icon: <AlertTriangle className="w-5 h-5" /> },
  { emoji: '✨', label: 'AI Activity Log', href: '/ai-activity', icon: <Brain className="w-5 h-5" /> },
]

const teamNavItems: NavItem[] = [
  { emoji: '👨‍🔧', label: 'Staff', href: '/staff', icon: <UserCheck className="w-5 h-5" /> },
  { emoji: '⏱️', label: 'Time Tracking', href: '/time-tracking', icon: <Clock4 className="w-5 h-5" /> },
  { emoji: '🔐', label: 'Permissions', href: '/permissions', icon: <LockKeyhole className="w-5 h-5" /> },
]

const systemNavItems: NavItem[] = [
  { emoji: '📑', label: 'Reports', href: '/reports', icon: <MonitorDot className="w-5 h-5" /> },
  { emoji: '🔗', label: 'Integrations', href: '/integrations', icon: <Plug className="w-5 h-5" /> },
  { emoji: '⚙️', label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
  { emoji: '💬', label: 'Support', href: '/support', icon: <HelpCircle className="w-5 h-5" /> },
]

interface SidebarProps {
  user?: {
    name: string
    email: string
    role: string
  }
  shop?: {
    name: string
    plan: string
    city?: string
    state?: string
  }
}

export function Sidebar({ user, shop }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dark Lavender spec + UX: hover-to-expand sidebar.
  const effectiveOpen = isOpen

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 220)
  }

  // Auto-expand when mouse is near left edge; auto-collapse when mouse leaves sidebar area.
  useEffect(() => {
    const setMainPadding = (open: boolean) => {
      const main = document.querySelector('.dash-main') as HTMLElement | null
      if (!main) return
      main.style.paddingLeft = open ? '256px' : '72px'
    }

    setMainPadding(isOpen)

    const handleMouseMove = (e: MouseEvent) => {
      // Expand if cursor is in the left edge activation zone.
      if (e.clientX <= 24) {
        if (!isOpen) setIsOpen(true)
        clearCloseTimeout()
        return
      }

      // If expanded, keep open while pointer is within sidebar width.
      if (isOpen && e.clientX <= 256) {
        clearCloseTimeout()
        return
      }

      // If expanded and pointer is away from sidebar, schedule close.
      if (isOpen && e.clientX > 256) {
        scheduleClose()
      }
    }

    const sidebar = sidebarRef.current

    const onEnter = () => {
      if (!isOpen) setIsOpen(true)
      clearCloseTimeout()
    }
    const onLeave = () => {
      scheduleClose()
    }

    document.addEventListener('mousemove', handleMouseMove)
    sidebar?.addEventListener('mouseenter', onEnter)
    sidebar?.addEventListener('mouseleave', onLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      sidebar?.removeEventListener('mouseenter', onEnter)
      sidebar?.removeEventListener('mouseleave', onLeave)
      clearCloseTimeout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      // Demo mode (UI-only): clear demo cookie and return to login.
      if (typeof document !== 'undefined' && document.cookie.includes('fx_demo=1')) {
        document.cookie = 'fx_demo=; path=/; max-age=0; samesite=lax'
        router.push('/login')
        router.refresh()
        return
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    return (
      <Link
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 px-4 py-3 rounded-[10px]',
          'text-white/60 text-sm font-medium',
          'transition-all duration-200 ease-out cursor-pointer',
          'hover:bg-white/[0.04] hover:text-white',
          isActive && 'bg-white/[0.06] text-white',
          !effectiveOpen && 'justify-center px-3'
        )}
      >
        {/* Active indicator glow pill */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
        )}
        <span
          className={cn(
            'flex-shrink-0 transition-transform group-hover:scale-105',
            effectiveOpen ? 'text-base w-5 text-center' : 'text-lg',
            isActive ? 'opacity-100' : 'opacity-90'
          )}
          aria-hidden="true"
        >
          {item.emoji || '•'}
        </span>
        {effectiveOpen && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10px] font-semibold">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-screen',
          'bg-[#0a0a0e]/90 backdrop-blur-xl',
          'border-r border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)]',
          'flex flex-col transition-all duration-300 ease-out z-40',
          effectiveOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn('flex items-center justify-between h-16 border-b border-white/10 w-full', effectiveOpen ? 'px-4' : 'px-0')}>
          <div className={cn('flex items-center', effectiveOpen ? 'gap-3' : 'justify-center w-full')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ReticleIcon size="md" color="purple" variant="idle" className="opacity-95 scale-[1.08] text-white" />
            </div>
            {effectiveOpen ? <FixologyLogo size="lg" animate={true} className="tracking-tight text-white" /> : null}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Core Operations */}
          <div>
            {effectiveOpen && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Core Operations
              </p>
            )}
            <div className="space-y-1">
              {coreNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Business & Money */}
          <div>
            {effectiveOpen && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Business & Money
              </p>
            )}
            <div className="space-y-1">
              {businessNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Intelligence */}
          <div>
            {effectiveOpen && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Intelligence
              </p>
            )}
            <div className="space-y-1">
              {intelligenceNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Team & Control */}
          <div>
            {effectiveOpen && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                Team & Control
              </p>
            )}
            <div className="space-y-1">
              {teamNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* System */}
          <div>
            {effectiveOpen && (
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                System
              </p>
            )}
            <div className="space-y-1">
              {systemNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className={cn(
          'p-3 border-t border-white/10 space-y-2',
          !effectiveOpen && 'flex flex-col items-center justify-center'
        )}>
          {/* Switch shop card */}
          {effectiveOpen && (
            <button
              onClick={() => {
                // UI only - would open shop switcher modal
                console.log('Switch shop (UI only)')
              }}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] hover:border-purple-400/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-purple-400/50 transition-colors">
                  <Building2 className="w-4 h-4 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-0.5">Current Shop</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {shop?.name || 'Demo Shop'}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {shop?.city && shop?.state ? `${shop.city}, ${shop.state}` : '—'} • {shop?.plan?.toLowerCase() || 'pro'} plan
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors flex-shrink-0" />
              </div>
            </button>
          )}

          <div className={cn(
            'flex items-center gap-3',
            effectiveOpen ? 'px-4 py-2' : 'px-0 py-2 justify-center w-full'
          )}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {effectiveOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {user?.role || 'Owner'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-60"
                  aria-label={signingOut ? 'Signing out' : 'Sign out'}
                >
                  <LogOut className="w-4 h-4 text-white/50" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}


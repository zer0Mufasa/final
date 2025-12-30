'use client'

// components/dashboard/sidebar.tsx
// Dashboard sidebar navigation with hover-based toggle

import { useState, useEffect, useRef } from 'react'
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
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number | string
}

const coreNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Tickets', href: '/tickets', icon: <Ticket className="w-5 h-5" /> },
  { label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Devices', href: '/devices', icon: <Smartphone className="w-5 h-5" /> },
  { label: 'Inventory', href: '/inventory', icon: <Package className="w-5 h-5" /> },
  { label: 'Diagnostics', href: '/diagnostics', icon: <Stethoscope className="w-5 h-5" /> },
]

const businessNavItems: NavItem[] = [
  { label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
  { label: 'Payments', href: '/payments', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Payouts', href: '/payouts', icon: <Banknote className="w-5 h-5" /> },
  { label: 'Estimates', href: '/estimates', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'Warranty & Returns', href: '/warranty', icon: <Shield className="w-5 h-5" /> },
]

const intelligenceNavItems: NavItem[] = [
  { label: 'Insights', href: '/insights', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Risk Monitor', href: '/risk-monitor', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'AI Activity Log', href: '/ai-activity', icon: <Brain className="w-5 h-5" /> },
]

const teamNavItems: NavItem[] = [
  { label: 'Staff', href: '/staff', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Time Tracking', href: '/time-tracking', icon: <Clock4 className="w-5 h-5" /> },
  { label: 'Permissions', href: '/permissions', icon: <LockKeyhole className="w-5 h-5" /> },
]

const systemNavItems: NavItem[] = [
  { label: 'Reports', href: '/reports', icon: <MonitorDot className="w-5 h-5" /> },
  { label: 'Integrations', href: '/integrations', icon: <Plug className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
  { label: 'Support', href: '/support', icon: <HelpCircle className="w-5 h-5" /> },
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
  const [isOpen, setIsOpen] = useState(false)
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const hoverZoneRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Respect manual collapse state
  const effectiveOpen = isOpen && !isManuallyCollapsed

  // Handle hover on left edge of page (only if not manually collapsed)
  useEffect(() => {
    if (isManuallyCollapsed) return

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is in the left edge zone (0-30px from left)
      if (e.clientX <= 30) {
        setIsOpen(true)
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      } else if (e.clientX > 30 && e.clientX < (isOpen ? 256 : 72)) {
        // Mouse is in sidebar area, keep it open
        setIsOpen(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }

    // Handle mouse leaving sidebar area
    const handleMouseLeave = (e: MouseEvent) => {
      // Only close if mouse is not in the hover zone
      if (e.clientX > 30) {
        // Delay collapse to allow moving to hover zone
        timeoutRef.current = setTimeout(() => {
          setIsOpen(false)
        }, 200)
      }
    }

    // Handle mouse entering sidebar
    const handleMouseEnter = () => {
      setIsOpen(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    const sidebar = sidebarRef.current

    if (sidebar) {
      sidebar.addEventListener('mouseleave', handleMouseLeave as any)
      sidebar.addEventListener('mouseenter', handleMouseEnter)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (sidebar) {
        sidebar.removeEventListener('mouseleave', handleMouseLeave as any)
        sidebar.removeEventListener('mouseenter', handleMouseEnter)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen, isManuallyCollapsed])

  // Update main content padding when sidebar state changes
  useEffect(() => {
    const main = document.querySelector('.dash-main') as HTMLElement
    if (main) {
      if (effectiveOpen) {
        main.style.paddingLeft = '288px' // 256px sidebar (w-64) + 32px gap
      } else {
        main.style.paddingLeft = '88px' // 72px sidebar (collapsed) + 16px gap
      }
    }
  }, [effectiveOpen])

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
          'relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-white/65 text-sm font-medium',
          'transition-all duration-200 ease-out cursor-pointer',
          'hover:bg-white/5 hover:text-white',
          isActive && 'bg-white/[0.08] text-[#dcd3ff]',
          !effectiveOpen && 'justify-center px-3'
        )}
      >
        {/* Active indicator glow pill */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-[#b9a6ff] to-[#7c5cff] shadow-[0_0_14px_rgba(185,166,255,0.55)]" />
        )}
        <span className={cn(
          'flex-shrink-0 transition-transform group-hover:scale-105',
          isActive && 'text-[#d3c7ff]'
        )}>
          {item.icon}
        </span>
        {effectiveOpen && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-semibold">
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
      {/* Hover zone on left edge */}
      <div
        ref={hoverZoneRef}
        className="fixed left-0 top-0 w-[30px] h-screen z-50 pointer-events-none"
      />

      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-screen',
          'bg-[#0a0a16]/80 backdrop-blur-2xl',
          'border-r border-white/10 shadow-[0_10px_60px_rgba(0,0,0,0.35)]',
          'flex flex-col transition-all duration-300 ease-out z-40',
          effectiveOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        {/* Logo + Toggle */}
        <div className={cn(
          'flex items-center justify-between h-16 border-b border-white/10 w-full',
          effectiveOpen ? 'px-4' : 'px-0'
        )}>
          <div className={cn(
            'flex items-center',
            effectiveOpen ? 'gap-3' : 'justify-center flex-1'
          )}>
            {effectiveOpen ? (
              <FixologyLogo size="lg" animate={true} className="tracking-tight" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border border-purple-500/30 flex items-center justify-center">
                <ReticleIcon size="lg" color="purple" variant="idle" className="opacity-95 scale-[1.08]" />
              </div>
            )}
          </div>
          {effectiveOpen && (
            <button
              onClick={() => setIsManuallyCollapsed(true)}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!effectiveOpen && (
            <button
              onClick={() => {
                setIsManuallyCollapsed(false)
                setIsOpen(true)
              }}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/50 hover:text-white w-full flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
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


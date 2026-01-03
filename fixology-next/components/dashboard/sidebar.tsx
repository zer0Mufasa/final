'use client'

// components/dashboard/sidebar.tsx
// Dashboard sidebar navigation with hover-based toggle and enhanced animations

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
  LogOut,
  Building2,
  UserCheck,
  Smartphone,
  Shield,
  AlertTriangle,
  Plug,
  HelpCircle,
  CreditCard,
  ClipboardList,
  Brain,
  Clock4,
  LockKeyhole,
  MonitorDot,
  ChevronRight,
  Sparkles,
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
  { emoji: '🔍', label: 'IMEI Lookup', href: '/imei', icon: <Smartphone className="w-5 h-5" />, badge: 'New' },
  { emoji: '📦', label: 'Inventory', href: '/inventory', icon: <Package className="w-5 h-5" /> },
  { emoji: '🩺', label: 'Diagnostics', href: '/diagnostics', icon: <Stethoscope className="w-5 h-5" /> },
]

const businessNavItems: NavItem[] = [
  { emoji: '🧾', label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
  { emoji: '💳', label: 'Payments', href: '/payments', icon: <CreditCard className="w-5 h-5" /> },
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
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
      main.style.transition = 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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

  const NavLink = ({ item, index = 0 }: { item: NavItem; index?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const isHovered = hoveredItem === item.href

    return (
      <Link
        href={item.href}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-white/60 text-sm font-medium',
          'transition-all duration-300 ease-out cursor-pointer',
          'hover:text-white',
          isActive && 'text-white',
          !effectiveOpen && 'justify-center px-3'
        )}
        style={{
          animationDelay: `${index * 30}ms`,
        }}
      >
        {/* Background glow on hover/active */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl transition-all duration-300',
            isActive
              ? 'bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10 border border-purple-500/20'
              : 'bg-transparent hover:bg-white/[0.04]',
            isHovered && !isActive && 'bg-white/[0.06]'
          )}
          style={{
            boxShadow: isActive
              ? '0 0 20px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : 'none',
          }}
        />

        {/* Active indicator glow pill */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300',
            isActive
              ? 'h-8 bg-gradient-to-b from-purple-400 to-fuchsia-500 opacity-100'
              : 'h-0 bg-purple-500 opacity-0'
          )}
          style={{
            boxShadow: isActive
              ? '0 0 15px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.3)'
              : 'none',
          }}
        />

        {/* Icon/Emoji with scale animation */}
        <span
          className={cn(
            'relative z-10 flex-shrink-0 transition-all duration-300',
            effectiveOpen ? 'text-base w-5 text-center' : 'text-lg',
            isActive ? 'opacity-100 scale-110' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'
          )}
          aria-hidden="true"
        >
          {item.emoji || '•'}
        </span>

        {/* Label with slide-in effect */}
        {effectiveOpen && (
          <>
            <span
              className={cn(
                'relative z-10 flex-1 transition-all duration-300',
                'transform',
                isActive ? 'translate-x-0 font-semibold' : 'translate-x-0 group-hover:translate-x-0.5'
              )}
            >
              {item.label}
            </span>

            {/* Badge with pulse effect */}
            {item.badge && (
              <span
                className={cn(
                  'relative z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide',
                  'bg-gradient-to-r from-purple-500/30 to-fuchsia-500/30 text-purple-200',
                  'border border-purple-400/30',
                  'shadow-[0_0_10px_rgba(139,92,246,0.2)]',
                  'transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                )}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.badge}
                </span>
              </span>
            )}

            {/* Arrow on hover */}
            <ChevronRight
              className={cn(
                'relative z-10 w-4 h-4 text-white/30 transition-all duration-300',
                'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                isActive && 'opacity-60 translate-x-0'
              )}
            />
          </>
        )}
      </Link>
    )
  }

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="relative px-4 mb-3 mt-1">
      <p className={cn(
        'text-[10px] font-bold uppercase tracking-[0.15em] text-white/35',
        'transition-all duration-300',
        effectiveOpen ? 'opacity-100' : 'opacity-0'
      )}>
        {title}
      </p>
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
    </div>
  )

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 h-screen',
          'backdrop-blur-2xl',
          'border-r border-white/[0.06]',
          'flex flex-col z-40',
          'transition-all duration-300 ease-out',
          effectiveOpen ? 'w-64' : 'w-[72px]'
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 14, 0.98) 0%, rgba(7, 7, 10, 0.99) 100%)',
          boxShadow: effectiveOpen
            ? '4px 0 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.05)'
            : '2px 0 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Ambient glow effect at top */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Logo + Toggle */}
        <div
          className={cn(
            'relative flex items-center justify-between h-16 border-b border-white/[0.06] w-full',
            effectiveOpen ? 'px-4' : 'px-0'
          )}
        >
          <div className={cn('flex items-center', effectiveOpen ? 'gap-3' : 'justify-center w-full')}>
            <div
              className={cn(
                'relative w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-violet-500 to-fuchsia-500',
                'shadow-lg shadow-violet-500/40',
                'transition-all duration-300',
                'group-hover:shadow-violet-500/60',
                effectiveOpen && 'hover:scale-105'
              )}
              style={{
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              <ReticleIcon
                size="md"
                color="purple"
                variant="idle"
                className="opacity-95 scale-[1.08] text-white"
              />
            </div>
            {effectiveOpen && (
              <div className="animate-fade-in-up">
                <FixologyLogo size="lg" animate={true} className="tracking-tight text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Core Operations */}
          <div>
            {effectiveOpen && <SectionHeader title="Core Operations" />}
            <div className="space-y-1">
              {coreNavItems.map((item, i) => (
                <NavLink key={item.href} item={item} index={i} />
              ))}
            </div>
          </div>

          {/* Business & Money */}
          <div>
            {effectiveOpen && <SectionHeader title="Business & Money" />}
            <div className="space-y-1">
              {businessNavItems.map((item, i) => (
                <NavLink key={item.href} item={item} index={i + coreNavItems.length} />
              ))}
            </div>
          </div>

          {/* Intelligence */}
          <div>
            {effectiveOpen && <SectionHeader title="Intelligence" />}
            <div className="space-y-1">
              {intelligenceNavItems.map((item, i) => (
                <NavLink key={item.href} item={item} index={i + coreNavItems.length + businessNavItems.length} />
              ))}
            </div>
          </div>

          {/* Team & Control */}
          <div>
            {effectiveOpen && <SectionHeader title="Team & Control" />}
            <div className="space-y-1">
              {teamNavItems.map((item, i) => (
                <NavLink key={item.href} item={item} index={i + coreNavItems.length + businessNavItems.length + intelligenceNavItems.length} />
              ))}
            </div>
          </div>

          {/* System */}
          <div>
            {effectiveOpen && <SectionHeader title="System" />}
            <div className="space-y-1">
              {systemNavItems.map((item, i) => (
                <NavLink key={item.href} item={item} index={i + coreNavItems.length + businessNavItems.length + intelligenceNavItems.length + teamNavItems.length} />
              ))}
            </div>
          </div>
        </nav>

        {/* User section */}
        <div
          className={cn(
            'relative p-3 border-t border-white/[0.06] space-y-3',
            !effectiveOpen && 'flex flex-col items-center justify-center'
          )}
        >
          {/* Subtle glow at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            }}
          />

          {/* Switch shop card */}
          {effectiveOpen && (
            <button
              onClick={() => console.log('Switch shop (UI only)')}
              className={cn(
                'relative w-full px-4 py-3 rounded-2xl',
                'bg-white/[0.03] border border-white/[0.08]',
                'hover:bg-white/[0.06] hover:border-purple-500/30',
                'transition-all duration-300 text-left group overflow-hidden'
              )}
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
              }}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                />
              </div>

              <div className="relative flex items-center gap-3">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br from-purple-500/20 to-purple-700/20',
                    'border border-purple-500/30',
                    'group-hover:border-purple-400/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]',
                    'transition-all duration-300'
                  )}
                >
                  <Building2 className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-0.5">
                    Current Shop
                  </p>
                  <p className="text-sm font-semibold text-white truncate group-hover:text-purple-100 transition-colors">
                    {shop?.name || 'Demo Shop'}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {shop?.city && shop?.state ? `${shop.city}, ${shop.state}` : '—'} •{' '}
                    <span className="text-purple-300/60">{shop?.plan?.toLowerCase() || 'pro'} plan</span>
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0" />
              </div>
            </button>
          )}

          {/* User profile */}
          <div
            className={cn(
              'relative flex items-center gap-3 rounded-xl',
              effectiveOpen ? 'px-4 py-2 hover:bg-white/[0.03]' : 'px-0 py-2 justify-center w-full',
              'transition-all duration-300 group'
            )}
          >
            <div
              className={cn(
                'relative w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0',
                'bg-gradient-to-br from-purple-500 to-purple-700',
                'shadow-lg shadow-purple-500/30',
                'transition-all duration-300',
                'group-hover:shadow-purple-500/50 group-hover:scale-105'
              )}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
              {/* Online indicator */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[rgb(var(--bg-secondary))]"
                style={{
                  background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                  boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)',
                }}
              />
            </div>
            {effectiveOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-purple-100 transition-colors">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-white/50 truncate">{user?.role || 'Owner'}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className={cn(
                    'p-2 rounded-lg transition-all duration-300',
                    'hover:bg-white/[0.06] hover:text-red-400',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                  aria-label={signingOut ? 'Signing out' : 'Sign out'}
                >
                  <LogOut
                    className={cn(
                      'w-4 h-4 text-white/40 transition-all duration-300',
                      'group-hover:text-white/60',
                      signingOut && 'animate-pulse'
                    )}
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

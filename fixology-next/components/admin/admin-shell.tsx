'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Bell,
  ChevronLeft,
  Crown,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Store,
  Users,
  CreditCard,
  ScrollText,
  Server,
  Search,
  X,
  Copy,
  Tags,
  Mail,
  AlertTriangle,
  Zap,
  Database,
  Webhook,
  Gift,
  FileText,
  Plug,
  TestTube,
  Key,
  Globe,
  Palette,
  MessageCircle,
  Download,
  Bookmark,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type AdminShellProps = {
  admin: {
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
}

type NavItem = { href: string; label: string; icon: any; badge?: string }

const NAV: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/shops', label: 'Shops', icon: Store },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/billing', label: 'Billing', icon: CreditCard },
      { href: '/admin/support', label: 'Support', icon: MessageSquare },
    ],
  },
  {
    title: 'Power Tools',
    items: [
      { href: '/admin/clone', label: 'Clone Center', icon: Copy },
      { href: '/admin/god-mode', label: 'God Mode', icon: Zap },
      { href: '/admin/segments', label: 'Tags & Segments', icon: Tags },
      { href: '/admin/emails', label: 'Email Center', icon: Mail },
      { href: '/admin/alerts', label: 'Alerts', icon: AlertTriangle },
      { href: '/admin/database', label: 'Database Tools', icon: Database },
      { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
      { href: '/admin/promotions', label: 'Promotions', icon: Gift },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/sync', label: 'Sync & Import', icon: Download },
      { href: '/admin/sandbox', label: 'Sandbox', icon: TestTube },
      { href: '/admin/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/system', label: 'System', icon: Server },
      { href: '/admin/features', label: 'Features', icon: Flag },
      { href: '/admin/announcements', label: 'Announcements', icon: Bell },
      { href: '/admin/sms', label: 'SMS Center', icon: MessageSquare },
      { href: '/admin/content', label: 'Content', icon: ScrollText },
      { href: '/admin/localization', label: 'Localization', icon: Globe },
      { href: '/admin/branding', label: 'Branding', icon: Palette },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { href: '/admin/onboarding', label: 'Onboarding', icon: Users },
      { href: '/admin/experiments', label: 'Experiments', icon: Flag },
      { href: '/admin/maintenance', label: 'Maintenance', icon: Server },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/api-keys', label: 'API Keys', icon: Key },
      { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    ],
  },
  {
    title: 'Security & Team',
    items: [
      { href: '/admin/team', label: 'Team', icon: UserCog },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageCircle },
    ],
  },
  {
    items: [
      { href: '/admin/bookmarks', label: 'Bookmarks', icon: Bookmark },
    ],
  },
]

function initials(name?: string) {
  const n = (name || 'Admin').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || 'A'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
}

function routeLabel(pathname: string) {
  if (pathname === '/admin') return 'Dashboard'
  if (pathname.startsWith('/admin/shops')) return 'Shops'
  if (pathname.startsWith('/admin/users')) return 'Users'
  if (pathname.startsWith('/admin/billing')) return 'Billing'
  if (pathname.startsWith('/admin/support')) return 'Support'
  if (pathname.startsWith('/admin/clone')) return 'Clone Center'
  if (pathname.startsWith('/admin/god-mode')) return 'God Mode'
  if (pathname.startsWith('/admin/segments')) return 'Tags & Segments'
  if (pathname.startsWith('/admin/emails')) return 'Email Center'
  if (pathname.startsWith('/admin/alerts')) return 'Alerts'
  if (pathname.startsWith('/admin/database')) return 'Database Tools'
  if (pathname.startsWith('/admin/webhooks')) return 'Webhooks'
  if (pathname.startsWith('/admin/promotions')) return 'Promotions'
  if (pathname.startsWith('/admin/reports')) return 'Reports'
  if (pathname.startsWith('/admin/integrations')) return 'Integrations'
  if (pathname.startsWith('/admin/sms')) return 'SMS Center'
  if (pathname.startsWith('/admin/content')) return 'Content Manager'
  if (pathname.startsWith('/admin/onboarding')) return 'Onboarding'
  if (pathname.startsWith('/admin/experiments')) return 'Experiments'
  if (pathname.startsWith('/admin/maintenance')) return 'Maintenance'
  if (pathname.startsWith('/admin/analytics')) return 'Analytics'
  if (pathname.startsWith('/admin/system')) return 'System'
  if (pathname.startsWith('/admin/features')) return 'Features'
  if (pathname.startsWith('/admin/announcements')) return 'Announcements'
  if (pathname.startsWith('/admin/audit')) return 'Audit Log'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  return 'Admin'
}

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true) // Start collapsed
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('fx_admin_collapsed')
      if (saved === '1') setCollapsed(true)
    } catch {}
  }, [])

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearCloseTimeout()
    closeTimeoutRef.current = setTimeout(() => setCollapsed(true), 220)
  }, [clearCloseTimeout])

  // Hover-based expand/collapse (desktop only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMouseMove = (e: MouseEvent) => {
      // Expand if cursor is in the left edge activation zone (24px)
      if (e.clientX <= 24) {
        if (collapsed) setCollapsed(false)
        clearCloseTimeout()
        return
      }

      // If expanded, keep open while pointer is within sidebar width (280px)
      if (!collapsed && e.clientX <= 280) {
        clearCloseTimeout()
        return
      }

      // If expanded and pointer is away from sidebar, schedule close
      if (!collapsed && e.clientX > 280) {
        scheduleClose()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearCloseTimeout()
    }
  }, [collapsed, clearCloseTimeout, scheduleClose])

  const setCollapsedPersist = (v: boolean) => {
    setCollapsed(v)
    try {
      window.localStorage.setItem('fx_admin_collapsed', v ? '1' : '0')
    } catch {}
  }

  const activeLabel = useMemo(() => routeLabel(pathname), [pathname])

  const onLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/admin/login'
    }
  }

  const Sidebar = ({ variant }: { variant: 'desktop' | 'mobile' }) => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/admin" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(192, 38, 211, 0.25) 100%)',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <Crown className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || variant === 'mobile') && (
            <div>
              <div className="text-sm font-bold text-white/90 leading-tight">Fixology</div>
              <div className="text-[11px] text-white/40 leading-tight">CEO Admin</div>
            </div>
          )}
        </Link>

        {variant === 'mobile' && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/70 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV.map((section, idx) => (
          <div key={idx}>
            {section.title && (!collapsed || variant === 'mobile') && (
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-white/35 uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                // Special handling for dashboard - only match exactly /admin
                const isActive = item.href === '/admin' 
                  ? pathname === '/admin'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => variant === 'mobile' && setMobileOpen(false)}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      collapsed && variant === 'desktop' ? 'justify-center' : '',
                      isActive
                        ? 'text-violet-300'
                        : 'text-white/55 hover:text-white/80 hover:bg-white/[0.05]'
                    )}
                    title={collapsed && variant === 'desktop' ? item.label : undefined}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 rounded-xl opacity-0 transition-opacity',
                        isActive && 'opacity-100'
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                'linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(192, 38, 211, 0.10) 100%)',
                              border: '1px solid rgba(139, 92, 246, 0.28)',
                              boxShadow: '0 12px 28px rgba(139, 92, 246, 0.14)',
                            }
                          : undefined
                      }
                    />
                    <Icon
                      className={cn(
                        'relative z-10 w-5 h-5 transition-transform',
                        isActive ? 'text-violet-300 scale-110' : 'text-white/55 group-hover:scale-105'
                      )}
                    />
                    {(!collapsed || variant === 'mobile') && (
                      <span className="relative z-10 text-sm font-medium">{item.label}</span>
                    )}
                    {item.badge && (!collapsed || variant === 'mobile') && (
                      <span className="relative z-10 ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className={cn('flex items-center gap-3 px-3 py-2 rounded-xl', collapsed && variant === 'desktop' ? 'justify-center' : '')}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            title={admin.email}
          >
            {initials(admin.name)}
          </div>
          {(!collapsed || variant === 'mobile') && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white/85 truncate">{admin.name}</div>
              <div className="text-[11px] text-white/40 truncate">{admin.role}</div>
            </div>
          )}
          <button
            onClick={onLogout}
            className={cn(
              'p-2 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white/80 transition-all',
              collapsed && variant === 'desktop' ? '' : 'ml-auto'
            )}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {variant === 'desktop' && (
          <button
            onClick={() => setCollapsedPersist(!collapsed)}
            className={cn(
              'mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl',
              'text-white/45 hover:text-white/70 hover:bg-white/[0.05] transition-all'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#07070a]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-[700px] h-[700px] bg-violet-500/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 w-[650px] h-[650px] bg-fuchsia-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 z-50 w-[300px] lg:hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(10,10,14,0.96) 0%, rgba(7,7,10,0.92) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '20px 0 60px rgba(0,0,0,0.45)',
              }}
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <Sidebar variant="mobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar (CSS transitions to avoid hydration mismatch) */}
      <aside
        className={cn(
          'hidden lg:block fixed left-0 top-0 bottom-0 z-40',
          'transition-[width] duration-300 ease-out',
          collapsed ? 'w-[84px]' : 'w-[280px]'
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,14,0.96) 0%, rgba(7,7,10,0.92) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '20px 0 60px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Sidebar variant="desktop" />
      </aside>

      {/* Content */}
      <div
        className={cn(
          'relative z-10 min-h-screen flex flex-col',
          'transition-[padding-left] duration-300 ease-out',
          'pl-0',
          collapsed ? 'lg:pl-[84px]' : 'lg:pl-[280px]'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30">
          <div
            className="border-b border-white/[0.06] backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 10, 14, 0.95) 0%, rgba(7, 7, 10, 0.92) 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:bg-white/[0.08] transition-all"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm text-white/45">Admin</div>
                    <div className="text-lg font-bold text-white/90 truncate">{activeLabel}</div>
                  </div>
                </div>

                <div className="hidden md:flex flex-1 max-w-xl">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      placeholder="Search shops, users, invoices…"
                      className={cn(
                        'w-full h-10 pl-11 pr-4 rounded-xl',
                        'bg-white/[0.04] border border-white/[0.08]',
                        'text-white/85 placeholder:text-white/35',
                        'focus:outline-none focus:border-violet-500/35 focus:ring-2 focus:ring-violet-500/15'
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <Shield className="w-4 h-4 text-violet-300" />
                    <span className="text-xs font-semibold text-white/70">{admin.role.replace('_', ' ')}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-white/[0.08] flex items-center justify-center text-sm font-bold text-white">
                    {initials(admin.name)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 animate-page-in">
          {children}
        </main>
      </div>
    </div>
  )
}


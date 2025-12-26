'use client'

// components/dashboard/sidebar.tsx
// Dashboard sidebar navigation

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Logo } from '@/components/shared/logo'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Package,
  FileText,
  Cpu,
  Smartphone,
  Calendar,
  MessageSquare,
  BarChart3,
  UserPlus,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number | string
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Tickets', href: '/tickets', icon: <Ticket className="w-5 h-5" /> },
  { label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Inventory', href: '/inventory', icon: <Package className="w-5 h-5" /> },
  { label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
]

const toolsNavItems: NavItem[] = [
  { label: 'AI Diagnostics', href: '/diagnostics', icon: <Cpu className="w-5 h-5" /> },
  { label: 'IMEI Lookup', href: '/imei', icon: <Smartphone className="w-5 h-5" /> },
  { label: 'Calendar', href: '/calendar', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
]

const otherNavItems: NavItem[] = [
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Team', href: '/team', icon: <UserPlus className="w-5 h-5" /> },
  { label: 'Autopilot', href: '/autopilot', icon: <Sparkles className="w-5 h-5" />, badge: 'New' },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
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
  const [collapsed, setCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
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
          'flex items-center gap-3 px-4 py-3 rounded-xl',
          'text-white/60 text-sm font-medium',
          'transition-all duration-200 ease-out cursor-pointer',
          'hover:bg-white/5 hover:text-white',
          isActive && 'bg-white/10 text-[#a78bfa]',
          collapsed && 'justify-center px-3'
        )}
      >
        <span className={cn(
          'flex-shrink-0 transition-transform group-hover:scale-110',
          isActive && 'text-[#a78bfa]'
        )}>
          {item.icon}
        </span>
        {!collapsed && (
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
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen',
        'bg-black/30 backdrop-blur-xl',
        'border-r border-white/10',
        'flex flex-col transition-all duration-300 ease-out z-40',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/10',
        collapsed && 'justify-center'
      )}>
        <Logo showText={!collapsed} size={collapsed ? 'sm' : 'md'} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main */}
        <div>
          {!collapsed && (
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Main
            </p>
          )}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          {!collapsed && (
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Tools
            </p>
          )}
          <div className="space-y-1">
            {toolsNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>

        {/* Other */}
        <div>
          {!collapsed && (
            <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Other
            </p>
          )}
          <div className="space-y-1">
            {otherNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className={cn(
        'p-3 border-t border-white/10',
        collapsed && 'flex flex-col items-center'
      )}>
        {!collapsed && shop && (
          <div className="px-4 py-3 mb-2 rounded-2xl bg-white/[0.04] border border-white/10">
            <p className="text-sm font-semibold text-white truncate">
              {shop.name}
            </p>
            <p className="text-xs text-white/50">
              {[shop.city, shop.state].filter(Boolean).join(', ') || '—'} • {shop.plan.toLowerCase()} plan
            </p>
          </div>
        )}

        <div className={cn(
          'flex items-center gap-3 px-4 py-2',
          collapsed && 'px-0 justify-center'
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-white/50 truncate">
                {user?.role || 'Owner'}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-60"
            aria-label={signingOut ? 'Signing out' : 'Sign out'}
          >
            <LogOut className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-20 -right-3 w-6 h-6 rounded-full',
          'bg-white/10 backdrop-blur-sm border border-white/20',
          'flex items-center justify-center',
          'text-white/60 hover:text-white',
          'transition-colors shadow-sm'
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  )
}


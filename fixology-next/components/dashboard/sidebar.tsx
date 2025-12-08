'use client'

// components/dashboard/sidebar.tsx
// Dashboard sidebar navigation

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Logo } from '@/components/shared/logo'
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
  }
}

export function Sidebar({ user, shop }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    return (
      <Link
        href={item.href}
        className={cn(
          'sidebar-item group',
          isActive && 'active',
          collapsed && 'justify-center px-3'
        )}
      >
        <span className={cn(
          'flex-shrink-0 transition-transform group-hover:scale-110',
          isActive && 'text-[rgb(var(--accent-light))]'
        )}>
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="badge badge-purple text-[10px]">
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
        'fixed left-0 top-0 h-screen bg-[rgb(var(--bg-secondary))]',
        'border-r border-[rgb(var(--border-subtle))]',
        'flex flex-col transition-all duration-300 ease-out z-40',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[rgb(var(--border-subtle))]',
        collapsed && 'justify-center'
      )}>
        <Logo showText={!collapsed} size={collapsed ? 'sm' : 'md'} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main */}
        <div>
          {!collapsed && (
            <p className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
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
            <p className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
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
            <p className="px-4 mb-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
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
        'p-3 border-t border-[rgb(var(--border-subtle))]',
        collapsed && 'flex flex-col items-center'
      )}>
        {!collapsed && shop && (
          <div className="px-4 py-2 mb-2 rounded-xl bg-[rgb(var(--bg-tertiary))]">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
              {shop.name}
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))] capitalize">
              {shop.plan.toLowerCase()} plan
            </p>
          </div>
        )}

        <div className={cn(
          'flex items-center gap-3 px-4 py-2',
          collapsed && 'px-0 justify-center'
        )}>
          <div className="avatar avatar-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-[rgb(var(--text-muted))] truncate">
                {user?.role || 'Owner'}
              </p>
            </div>
          )}
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-[rgb(var(--text-muted))]" />
          </button>
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-20 -right-3 w-6 h-6 rounded-full',
          'bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-subtle))]',
          'flex items-center justify-center',
          'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]',
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


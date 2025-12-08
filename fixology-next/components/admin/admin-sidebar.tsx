'use client'

// components/admin/admin-sidebar.tsx
// Admin panel sidebar for platform admins

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Logo } from '@/components/shared/logo'
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Activity,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Shops', href: '/admin/shops', icon: <Store className="w-5 h-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Billing', href: '/admin/billing', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Activity', href: '/admin/activity', icon: <Activity className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
]

interface AdminSidebarProps {
  admin: {
    name: string
    email: string
    role: string
  }
}

export function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[rgb(var(--bg-secondary))] border-r border-[rgb(var(--border-subtle))] flex flex-col z-40">
      {/* Logo with Admin badge */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-[rgb(var(--border-subtle))]">
        <Logo showText={true} size="md" />
        <span className="badge bg-red-500/20 text-red-400">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sidebar-item group',
                  isActive && 'active'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 transition-transform group-hover:scale-110',
                  isActive && 'text-[rgb(var(--accent-light))]'
                )}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Admin info */}
      <div className="p-3 border-t border-[rgb(var(--border-subtle))]">
        <div className="px-4 py-2 mb-2 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/5 border border-red-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
              {admin.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="avatar avatar-sm flex-shrink-0 bg-gradient-to-br from-red-500 to-red-700">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
              {admin.name}
            </p>
            <p className="text-xs text-[rgb(var(--text-muted))] truncate">
              {admin.email}
            </p>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <LogOut className="w-4 h-4 text-[rgb(var(--text-muted))]" />
          </button>
        </div>
      </div>
    </aside>
  )
}


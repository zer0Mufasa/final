'use client'

// components/dashboard/left-rail.tsx
// Left icon rail navigation (collapsed sidebar)

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Tickets', href: '/tickets', icon: <Ticket className="w-5 h-5" /> },
  { label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Inventory', href: '/inventory', icon: <Package className="w-5 h-5" /> },
  { label: 'Messages', href: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

export function LeftRail() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col items-center py-4 z-30">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative w-12 h-12 rounded-xl flex items-center justify-center mb-2',
              'text-white/60 transition-all duration-200',
              'hover:bg-white/5 hover:text-white',
              isActive && 'bg-white/10 text-purple-400'
            )}
            title={item.label}
          >
            {item.icon}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />
            )}
          </Link>
        )
      })}
    </aside>
  )
}


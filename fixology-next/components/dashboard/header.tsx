'use client'

// components/dashboard/header.tsx
// Dashboard header with search and notifications

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Search, Bell, Plus, Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white/[0.03] backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left - Title or Search */}
        <div className="flex items-center gap-4">
          {title && !searchOpen && (
            <div>
              <h1 className="text-lg font-bold text-white">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-white/60">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className={cn(
            'relative transition-all duration-300',
            searchOpen ? 'w-80' : 'w-10'
          )}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={cn(
                'absolute left-0 top-0 p-2.5 rounded-xl',
                'text-white/60 hover:text-white',
                'hover:bg-white/5 transition-colors',
                searchOpen && 'bg-white/10'
              )}
            >
              <Search className="w-5 h-5" />
            </button>
            {searchOpen && (
              <input
                type="text"
                placeholder="Search tickets, customers..."
                className="w-full pl-12 pr-4 py-2.5 h-10 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 border border-white/10">
            <kbd className="text-xs text-white/60">⌘</kbd>
            <kbd className="text-xs text-white/60">K</kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </header>
  )
}


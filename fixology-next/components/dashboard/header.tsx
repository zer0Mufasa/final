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
    <header className="sticky top-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-20 px-8">
        {/* Left - Title or Search */}
        <div className="flex items-center gap-4">
          {title && !searchOpen && (
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-white/60 font-medium">
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
            searchOpen ? 'w-80' : 'w-12'
          )}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={cn(
                'absolute left-0 top-0 p-3 rounded-xl',
                'text-white/60 hover:text-white',
                'hover:bg-white/5 transition-all',
                searchOpen && 'bg-white/10'
              )}
            >
              <Search className="w-5 h-5" />
            </button>
            {searchOpen && (
              <input
                type="text"
                placeholder="Search tickets, customers..."
                className="w-full pl-14 pr-4 py-3 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 transition-all"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <kbd className="text-xs text-white/50 font-mono">⌘</kbd>
            <kbd className="text-xs text-white/50 font-mono">K</kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black/30" />
          </button>

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </header>
  )
}


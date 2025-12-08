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
    <header className="sticky top-0 z-30 bg-[rgb(var(--bg-primary))]/80 backdrop-blur-xl border-b border-[rgb(var(--border-subtle))]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left - Title or Search */}
        <div className="flex items-center gap-4">
          {title && !searchOpen && (
            <div>
              <h1 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-[rgb(var(--text-muted))]">
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
                'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]',
                'hover:bg-white/5 transition-colors',
                searchOpen && 'bg-[rgb(var(--bg-tertiary))]'
              )}
            >
              <Search className="w-5 h-5" />
            </button>
            {searchOpen && (
              <input
                type="text"
                placeholder="Search tickets, customers..."
                className="input pl-12 pr-4 py-2.5 h-10"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border-subtle))]">
            <kbd className="text-xs text-[rgb(var(--text-muted))]">⌘</kbd>
            <kbd className="text-xs text-[rgb(var(--text-muted))]">K</kbd>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[rgb(var(--error))] rounded-full" />
          </button>

          {/* Quick Add */}
          <button className="p-2.5 rounded-xl bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-dark))] text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
            <Plus className="w-5 h-5" />
          </button>

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </header>
  )
}


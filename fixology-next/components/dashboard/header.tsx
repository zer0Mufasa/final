'use client'

// components/dashboard/header.tsx
// Command center header with shop info, search, and actions

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Search, Bell, Plus, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  // New command center props
  shopName?: string
  location?: string
  user?: {
    name: string
    email: string
  }
  // Legacy props for other pages
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ shopName, location, user, title, description, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Use command center layout if shopName is provided, otherwise use legacy layout
  const isCommandCenter = !!shopName

  return (
    <header className="sticky top-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className={`flex items-center justify-between ${isCommandCenter ? 'h-16 px-6' : 'h-20 px-8'}`}>
        {/* Left - Shop name + location (command center) or Title (legacy) */}
        <div className="flex items-center gap-4">
          {isCommandCenter ? (
            shopName && (
              <div>
                <h1 className="text-lg font-bold text-white">
                  {shopName}
                </h1>
                {location && (
                  <p className="text-xs text-white/60">
                    {location}
                  </p>
                )}
              </div>
            )
          ) : (
            title && !searchOpen && (
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
            )
          )}
        </div>

        {/* Center - Global search (command center) or expandable search (legacy) */}
        {isCommandCenter ? (
          <div className={cn(
            'relative flex-1 max-w-2xl mx-8 transition-all duration-300',
            searchOpen ? 'w-full' : 'w-64'
          )}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search ticket #, phone, IMEI, device..."
                className="w-full pl-12 pr-4 py-2.5 h-10 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          </div>
        ) : (
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
        )}

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {isCommandCenter ? (
            <>
              {/* New Ticket button */}
              <Link
                href="/tickets/new"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold hover:opacity-90 transition-opacity text-sm shadow-lg shadow-purple-500/30"
              >
                <Plus className="w-4 h-4" />
                New Ticket
              </Link>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black/30" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-xl p-2">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-white/60">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/logout"
                      className="block px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                      Sign out
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}


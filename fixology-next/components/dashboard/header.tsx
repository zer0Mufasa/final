'use client'

// components/dashboard/header.tsx
// Command center header with shop info, search, and actions

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Search, Bell, Plus, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  shopName?: string
  location?: string
  user?: {
    name: string
    email: string
  }
}

export function Header({ shopName, location, user }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left - Shop name + location */}
        <div className="flex items-center gap-4">
          {shopName && (
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
          )}
        </div>

        {/* Center - Global search */}
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

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  )
}


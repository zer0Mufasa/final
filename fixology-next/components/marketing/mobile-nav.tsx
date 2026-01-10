'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
]

export function MarketingNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="mobile-header fixed top-0 left-0 right-0 z-[100] bg-[#0f0a1a]/95 backdrop-blur-xl border-b border-violet-500/10 md:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Fixology</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'inline-flex items-center gap-2',
              'px-3 py-2 rounded-full',
              'bg-black/60 backdrop-blur-xl',
              'border border-white/15',
              'text-white/90',
              'shadow-[0_10px_30px_rgba(0,0,0,0.45)]',
              'hover:bg-black/70 hover:border-white/25 hover:text-white',
              'active:scale-[0.98]',
              'transition-all'
            )}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="text-xs font-semibold tracking-wide">
              {isOpen ? 'Close' : 'Menu'}
            </span>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          'md:hidden absolute top-full left-0 right-0 bg-[#0f0a1a]/97 backdrop-blur-2xl border-b border-white/[0.08] overflow-hidden transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
          isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-xl transition-colors bg-white/[0.06] border border-white/[0.12] text-white/90 hover:text-white hover:bg-white/[0.12] hover:border-white/20"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-white/[0.08] space-y-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.16] rounded-xl transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-xl transition-colors shadow-[0_10px_30px_rgba(124,58,237,0.35)]"
            >
              Get Started →
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

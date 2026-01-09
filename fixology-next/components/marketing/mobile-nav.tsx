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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#07070a]/80 backdrop-blur-xl border-b border-white/[0.06] md:hidden">
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
            className="p-2 text-white/70 hover:text-white"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={cn(
          'md:hidden absolute top-full left-0 right-0 bg-[#0a0a0f]/98 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-white/70 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-white/[0.08] space-y-2">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-white/70 hover:text-white border border-white/[0.1] rounded-xl transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-xl transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

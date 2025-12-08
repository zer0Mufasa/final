'use client'

// components/shared/logo.tsx
// Fixology logo component

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <Link
      href="/"
      className={cn('flex items-center gap-3', className)}
    >
      <div
        className={cn(
          sizes[size],
          'rounded-xl flex items-center justify-center',
          'bg-gradient-to-br from-purple-500 to-purple-700',
          'shadow-lg shadow-purple-500/30'
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-6 h-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.25 9V15L12 19.25L4.75 15V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13.25V19.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            textSizes[size],
            'font-display font-bold text-[rgb(var(--text-primary))]'
          )}
        >
          Fixology
        </span>
      )}
    </Link>
  )
}


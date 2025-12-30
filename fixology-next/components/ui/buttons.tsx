'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }

export function ButtonPrimary({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0',
        'hover:translate-y-[-1px]',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${theme.colors.lavender} 0%, ${theme.colors.lavenderDeep} 100%)`,
        color: '#0b0a14',
        boxShadow: theme.shadows.sm,
      }}
    >
      {children}
    </button>
  )
}

export function ButtonSecondary({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-offset-0',
        'border',
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: theme.colors.border,
        color: theme.colors.text,
      }}
    >
      {children}
    </button>
  )
}

export function ButtonGhost({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-offset-0',
        className
      )}
      style={{
        background: 'transparent',
        color: theme.colors.text,
      }}
    >
      {children}
    </button>
  )
}


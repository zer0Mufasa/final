'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }

export function ButtonPrimary({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[10px] transition focus:outline-none focus:ring-2 focus:ring-offset-0',
        className
      )}
      style={{
        background: theme.colors.lavender,
        color: '#ffffff',
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
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[10px] transition focus:outline-none focus:ring-2 focus:ring-offset-0',
        'border border-current',
        className
      )}
      style={{
        background: '#ffffff',
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
        'inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-[10px] transition focus:outline-none focus:ring-2 focus:ring-offset-0',
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


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
        background: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
        color: '#ffffff',
        boxShadow: '0 8px 20px rgba(139, 92, 246, 0.28)',
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
        background: 'rgba(255,255,255,0.04)',
        borderColor: theme.colors.border,
        color: theme.colors.secondary,
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
        color: theme.colors.secondary,
      }}
    >
      {children}
    </button>
  )
}


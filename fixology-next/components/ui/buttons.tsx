'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }

export const ButtonPrimary = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
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
)
ButtonPrimary.displayName = 'ButtonPrimary'

export const ButtonSecondary = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-[10px] transition focus:outline-none focus:ring-2 focus:ring-offset-0',
          'bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
          className
        )}
      >
        {children}
      </button>
    )
  }
)
ButtonSecondary.displayName = 'ButtonSecondary'

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


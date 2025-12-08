'use client'

// components/ui/button.tsx
// Reusable button component with variants

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: cn(
        'inline-flex items-center justify-center gap-2 rounded-xl',
        'text-sm font-semibold text-white',
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'bg-gradient-to-r from-red-500 to-red-600',
        'shadow-[0_4px_12px_rgba(239,68,68,0.3)]',
        'hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5'
      ),
    }

    const sizes = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-5 py-3 text-sm',
      lg: 'px-6 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }


'use client'

// components/ui/input.tsx
// Reusable input component

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, type, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="label">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'input',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-[rgb(var(--error))] focus:border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }


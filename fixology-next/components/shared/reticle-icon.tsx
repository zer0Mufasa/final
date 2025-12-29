// components/shared/reticle-icon.tsx
// Fixology reticle icon - functional AI indicator

'use client'

import { cn } from '@/lib/utils/cn'

interface ReticleIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'idle' | 'focus' | 'rotate' | 'lock' | 'analyzing'
  color?: 'purple' | 'green' | 'amber' | 'red' | 'white'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const colorClasses = {
  purple: 'text-purple-400',
  green: 'text-green-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  white: 'text-white',
}

const variantClasses = {
  default: '',
  idle: 'reticle-idle',
  focus: 'reticle-focus',
  rotate: 'reticle-loader-rotate',
  lock: 'scale-110 transition-transform duration-300',
  analyzing: 'reticle-loader-pulse',
}

export function ReticleIcon({ 
  size = 'md', 
  variant = 'default', 
  color = 'purple',
  className 
}: ReticleIconProps) {
  const sizeClass = sizeClasses[size]
  const colorClass = colorClasses[color]
  const variantClass = variantClasses[variant]

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClass, colorClass, variantClass, className)}
    >
      {/* Outer ring with circuit traces */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      {/* Middle ring */}
      <circle
        cx="12"
        cy="12"
        r="7"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      {/* Inner ring */}
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Crosshair */}
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
      />
      {/* Circuit traces (small nodes around perimeter) */}
      <circle cx="12" cy="2" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="22" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="2" cy="12" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="22" cy="12" r="0.8" fill="currentColor" opacity="0.6" />
      {/* Diagonal traces */}
      <circle cx="17" cy="7" r="0.6" fill="currentColor" opacity="0.4" />
      <circle cx="7" cy="17" r="0.6" fill="currentColor" opacity="0.4" />
      <circle cx="17" cy="17" r="0.6" fill="currentColor" opacity="0.4" />
      <circle cx="7" cy="7" r="0.6" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// Animated reticle for loading states
export function ReticleLoader({ 
  size = 'md',
  color = 'purple',
  text,
  className 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'purple' | 'green' | 'amber' | 'red' | 'white'
  text?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <ReticleIcon size={size} variant="analyzing" color={color} />
        {/* Rotating outer ring */}
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent',
          'border-t-current opacity-25 reticle-loader-rotate',
          sizeClasses[size]
        )} />
      </div>
      {text && (
        <p className={cn(
          'text-xs font-medium',
          color === 'purple' ? 'text-purple-400' :
          color === 'green' ? 'text-green-400' :
          color === 'amber' ? 'text-amber-400' :
          color === 'red' ? 'text-red-400' :
          'text-white/60'
        )}>
          {text}
        </p>
      )}
    </div>
  )
}


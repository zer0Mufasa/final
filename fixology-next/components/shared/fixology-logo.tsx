// components/shared/fixology-logo.tsx
// Fixology logo with animated reticle in the "o"

'use client'

import { cn } from '@/lib/utils/cn'
import { ReticleIcon } from './reticle-icon'

interface FixologyLogoProps {
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

const reticleSizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
}

export function FixologyLogo({ size = 'md', animate = true, className }: FixologyLogoProps) {
  return (
    <div className={cn('flex items-center gap-0.5 leading-none', sizeClasses[size], className)}>
      {/* F */}
      <span className="font-bold text-purple-400">F</span>
      
      {/* i */}
      <span className="font-bold text-purple-400">i</span>
      
      {/* x */}
      <span className="font-bold text-purple-400">x</span>
      
      {/* o with animated reticle */}
      <span className="relative inline-flex items-center justify-center -mx-0.5">
        {animate ? (
          <ReticleIcon 
            size={reticleSizeMap[size]} 
            variant="idle"
            color="purple"
            className="transition-transform duration-300 hover:scale-110 scale-[1.08]"
          />
        ) : (
          <ReticleIcon 
            size={reticleSizeMap[size]} 
            color="purple"
            className="scale-[1.08]"
          />
        )}
      </span>
      
      {/* l */}
      <span className="font-bold text-purple-400">l</span>
      
      {/* o */}
      <span className="font-bold text-purple-400">o</span>
      
      {/* g */}
      <span className="font-bold text-purple-400">g</span>
      
      {/* y */}
      <span className="font-bold text-purple-400">y</span>
    </div>
  )
}


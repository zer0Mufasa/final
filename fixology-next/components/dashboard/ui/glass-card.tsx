'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface GlassCardProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'glow' | 'interactive' | 'gradient'
  glowColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose'
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({
  className,
  children,
  variant = 'default',
  glowColor = 'purple',
  hover = true,
  onClick,
}: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const glowColors = {
    purple: {
      border: 'rgba(139, 92, 246, 0.3)',
      shadow: 'rgba(139, 92, 246, 0.15)',
      hoverBorder: 'rgba(139, 92, 246, 0.5)',
      hoverShadow: 'rgba(139, 92, 246, 0.25)',
    },
    blue: {
      border: 'rgba(59, 130, 246, 0.3)',
      shadow: 'rgba(59, 130, 246, 0.15)',
      hoverBorder: 'rgba(59, 130, 246, 0.5)',
      hoverShadow: 'rgba(59, 130, 246, 0.25)',
    },
    emerald: {
      border: 'rgba(52, 211, 153, 0.3)',
      shadow: 'rgba(52, 211, 153, 0.15)',
      hoverBorder: 'rgba(52, 211, 153, 0.5)',
      hoverShadow: 'rgba(52, 211, 153, 0.25)',
    },
    amber: {
      border: 'rgba(251, 191, 36, 0.3)',
      shadow: 'rgba(251, 191, 36, 0.15)',
      hoverBorder: 'rgba(251, 191, 36, 0.5)',
      hoverShadow: 'rgba(251, 191, 36, 0.25)',
    },
    rose: {
      border: 'rgba(244, 63, 94, 0.3)',
      shadow: 'rgba(244, 63, 94, 0.15)',
      hoverBorder: 'rgba(244, 63, 94, 0.5)',
      hoverShadow: 'rgba(244, 63, 94, 0.25)',
    },
  }

  const colors = glowColors[glowColor]

  const getStyles = () => {
    const base = {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
    }

    switch (variant) {
      case 'glow':
        return {
          ...base,
          border: `1px solid ${isHovered ? colors.hoverBorder : colors.border}`,
          boxShadow: isHovered
            ? `0 0 30px ${colors.hoverShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
            : `0 0 20px ${colors.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
        }
      case 'gradient':
        return {
          ...base,
          background: `linear-gradient(135deg, ${colors.shadow} 0%, rgba(255, 255, 255, 0.02) 100%)`,
          border: `1px solid ${isHovered ? colors.hoverBorder : colors.border}`,
          boxShadow: isHovered
            ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px ${colors.hoverShadow}`
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }
      case 'interactive':
        return {
          ...base,
          border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
          boxShadow: isHovered
            ? '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
          cursor: 'pointer',
        }
      default:
        return {
          ...base,
          border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.06)'}`,
          boxShadow: isHovered
            ? '0 20px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }
    }
  }

  return (
    <div
      className={cn(
        'relative p-6 overflow-hidden transition-all duration-300 ease-out',
        className
      )}
      style={getStyles()}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      onClick={onClick}
    >
      {/* Shimmer effect on hover */}
      {hover && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)',
            animation: isHovered ? 'shimmer 2s linear infinite' : 'none',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Simple stat card wrapper
export function StatCardWrapper({
  className,
  children,
  variant = 'default',
}: {
  className?: string
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
}) {
  const variantStyles = {
    success: {
      background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0.02) 100%)',
      border: '1px solid rgba(52, 211, 153, 0.2)',
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.02) 100%)',
      border: '1px solid rgba(251, 191, 36, 0.2)',
    },
    error: {
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
    info: {
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
    },
    default: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    },
  }

  const style = variantStyles[variant]

  return (
    <div
      className={cn(
        'p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5',
        className
      )}
      style={{
        ...style,
        backdropFilter: 'blur(20px)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {children}
    </div>
  )
}

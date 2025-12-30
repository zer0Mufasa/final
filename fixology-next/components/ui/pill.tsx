'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

const toneMap = {
  neutral: { bg: 'rgba(255,255,255,0.06)', border: theme.colors.border, text: theme.colors.muted },
  success: { bg: theme.colors.successTint, border: 'rgba(34,197,94,0.25)', text: 'rgba(167,243,208,0.95)' },
  warning: { bg: theme.colors.warningTint, border: 'rgba(251,191,36,0.3)', text: 'rgba(254,240,138,0.95)' },
  danger: { bg: theme.colors.dangerTint, border: 'rgba(248,113,113,0.28)', text: 'rgba(254,202,202,0.98)' },
  info: { bg: theme.colors.infoTint, border: 'rgba(96,165,250,0.28)', text: 'rgba(191,219,254,0.98)' },
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: keyof typeof toneMap
  className?: string
}) {
  const t = toneMap[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full border',
        className
      )}
      style={{ background: t.bg, borderColor: t.border, color: t.text }}
    >
      {children}
    </span>
  )
}


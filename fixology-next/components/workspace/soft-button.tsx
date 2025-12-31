'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'outline' }

export function SoftButton({ className, tone = 'primary', children, ...rest }: ButtonProps) {
  const tones = {
    primary:
      'text-white border border-white/0 ' +
      'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 ' +
      'shadow-[0_8px_20px_rgba(139,92,246,0.28)]',
    outline:
      'bg-white/[0.04] text-white/85 border border-white/10 hover:border-white/20 hover:bg-white/[0.06]',
    ghost:
      'bg-transparent text-white/70 border border-transparent hover:border-white/10 hover:bg-white/[0.04]',
  }
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25 focus:border-[#8B5CF6]/40',
        tones[tone],
        className
      )}
    >
      {children}
    </button>
  )
}


'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'outline' }

export function SoftButton({ className, tone = 'primary', children, ...rest }: ButtonProps) {
  const tones = {
    primary: 'bg-[#8B7CF6] text-white border border-[#8B7CF6]/30 hover:bg-[#7A6AF0]',
    outline: 'bg-white text-[#374151] border border-[#e5e7eb] hover:border-[#8B7CF6]/35',
    ghost: 'bg-transparent text-[#374151] border border-transparent hover:border-[#8B7CF6]/25 hover:bg-[#8B7CF6]/8',
  }
  return (
    <button
      {...rest}
      className={cn('inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition', tones[tone], className)}
    >
      {children}
    </button>
  )
}


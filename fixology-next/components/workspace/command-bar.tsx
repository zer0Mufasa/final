'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'
import { Search, ChevronDown } from 'lucide-react'

export function CommandBar({
  onSearch,
  actions,
  roleLabel,
  shopName,
}: {
  onSearch?: (q: string) => void
  actions?: React.ReactNode
  roleLabel?: string
  shopName?: string
}) {
  const [q, setQ] = useState('')
  return (
    <div
      className="border px-3 py-2 flex items-center gap-3"
      style={{
        background: theme.surfaces.panelAlt,
        borderColor: theme.colors.border,
        backdropFilter: `blur(${theme.blur.sm})`,
        borderRadius: theme.radii.panel,
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            onSearch?.(e.target.value)
          }}
          className={cn(
            'w-full rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-3 py-2 text-sm text-white/85 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40'
          )}
          placeholder='Search or jump…'
        />
      </div>

      <div className="hidden sm:flex items-center gap-2 text-xs text-white/55">
        <span className="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/10">{shopName || 'Demo Shop'}</span>
        <span className="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/10">{roleLabel || 'Owner'}</span>
      </div>

      {actions}

      <button className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs text-white/75">
        Quick actions
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}


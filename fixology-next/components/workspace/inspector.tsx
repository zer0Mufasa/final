'use client'

import { cn } from '@/lib/utils/cn'
import { theme } from '@/lib/theme/tokens'

export function Inspector({
  title,
  children,
  actions,
  className,
}: {
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <aside
      className={cn('rounded-2xl border p-4 space-y-3', className)}
      style={{
        background: theme.surfaces.panel,
        borderColor: theme.borders.hairline,
        backdropFilter: `blur(${theme.blur.md})`,
        minHeight: '100%',
      }}
    >
      {title ? (
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          {actions}
        </div>
      ) : null}
      {children}
    </aside>
  )
}


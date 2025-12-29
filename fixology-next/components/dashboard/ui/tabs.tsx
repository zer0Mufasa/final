'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils/cn'

export function Tabs({
  value,
  onValueChange,
  tabs,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  tabs: { value: string; label: string }[]
  className?: string
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      <TabsPrimitive.List className="inline-flex items-center gap-1 rounded-2xl bg-white/[0.04] border border-white/10 p-1">
        {tabs.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              'px-3 py-2 text-sm font-semibold rounded-xl',
              'text-white/55 hover:text-white/85 hover:bg-white/[0.06]',
              'data-[state=active]:bg-white/[0.10] data-[state=active]:text-white',
              'transition-colors outline-none'
            )}
          >
            {t.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  )
}



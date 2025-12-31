'use client'

import type { ReactNode } from 'react'
import { FixoProvider, FixoWidget } from './fixo-chat-widget'

// Wrap the dashboard (and any route) with this to enable Fixo globally.
export function FixoLayout({ children }: { children: ReactNode }) {
  return (
    <FixoProvider>
      {children}
      <FixoWidget />
    </FixoProvider>
  )
}


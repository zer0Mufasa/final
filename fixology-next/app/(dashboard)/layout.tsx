import type { ReactNode } from 'react'
import { DashboardClientLayout } from './layout-client'

// This layout is intentionally static: client-side code will fetch `/api/me` and redirect as needed.
// This avoids fragile server-side rendering failures that can surface as generic /500 pages on Vercel.
export const dynamic = 'force-static'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}


import type { ReactNode } from 'react'
import { DashboardClientLayout } from './layout-client'

// NOTE:
// The dashboard shell is client-driven (it fetches `/api/me` and handles unauth/demo UX).
// Keeping this layout static avoids production-only server 500s observed on Vercel for dashboard routes.
export const dynamic = 'force-static'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}


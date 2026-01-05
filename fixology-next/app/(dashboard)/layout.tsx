import type { ReactNode } from 'react'
import { DashboardClientLayout } from './layout-client'

// Keep this segment on Node.js. (Client layout does not use Prisma, but API routes do.)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}


// app/(dashboard)/dashboard/page.tsx
// UI-only dashboard (mock data). Real data wiring comes later.

import { DashboardClient } from './ui'

export const metadata = {
  title: 'Dashboard | Fixology',
}

export default function DashboardPage() {
  return <DashboardClient />
}

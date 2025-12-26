// app/(dashboard)/dashboard/page.tsx
// We’re using the legacy static dashboard (public/dashboard/index.html).
// Redirect /dashboard -> /dashboard/index.html

import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/dashboard/index.html')
}


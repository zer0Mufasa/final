// app/(dashboard)/tickets/page.tsx
// UI-only tickets hub (mock data). Real data wiring comes later.

import { TicketsClient } from './ui'

export const metadata = {
  title: 'Tickets | Fixology',
}

export default function TicketsPage() {
  return <TicketsClient />
}


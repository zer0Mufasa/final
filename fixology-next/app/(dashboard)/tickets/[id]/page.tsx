import { TicketDetailClient } from './ui'

export const metadata = {
  title: 'Ticket | Fixology',
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return <TicketDetailClient id={params.id} />
}



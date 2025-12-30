import { TicketDetailClient } from '../ui'

export default function OverviewPage({ params }: { params: { id: string } }) {
  return <TicketDetailClient id={params.id} />
}


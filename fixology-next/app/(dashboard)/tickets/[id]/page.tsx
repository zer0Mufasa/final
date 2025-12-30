import TicketSimple from './simple-ui'

export const metadata = {
  title: 'Ticket | Fixology',
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return <TicketSimple id={params.id} />
}



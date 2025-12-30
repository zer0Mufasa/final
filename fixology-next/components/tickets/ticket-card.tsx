'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Ticket } from '@/lib/mock/types'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { cn } from '@/lib/utils/cn'
import { MessageSquare } from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hrs = hoursFromNow(ticket.promisedAt)
  const promisedLabel = hrs >= 0 ? `Promised in ${hrs}h` : `Promised ${Math.abs(hrs)}h ago`
  const promisedCls = hrs >= 0 ? 'text-white/45' : 'text-red-300'

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the message button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/tickets/${ticket.id}`)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        // Prevent context menu
        e.preventDefault()
      }}
      onClick={handleClick}
      className={cn(
        'rounded-2xl bg-white/[0.035] border border-white/10 p-4 cursor-grab active:cursor-grabbing',
        'hover:bg-white/[0.055] transition-colors',
        isDragging && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-extrabold tracking-tight text-white/90">{ticket.ticketNumber}</div>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="text-sm text-white/80 mt-1 truncate">{ticket.customerName}</div>
          <div className="text-xs text-white/55 mt-0.5 truncate">{ticket.device}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-white/85">{fmtMoney(ticket.price)}</div>
          <div className={cn('text-xs font-semibold mt-0.5', promisedCls)}>{promisedLabel}</div>
              <div className="flex items-center gap-2">
                <span className="badge bg-red-500/15 text-red-200 border border-red-500/30 text-[11px]">$
                  {ticket.price}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // UI-only: would open checkout drawer
                    console.log('Collect payment (UI)')
                  }}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-purple-400/40 hover:text-white text-white/70"
                  title={`Due $${ticket.price}`}
                >
                  $
                </button>
              </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {ticket.risk !== 'none' && <RiskBadge risk={ticket.risk} />}
        <button
          onClick={(e) => {
            e.stopPropagation()
            // UI only - would open message modal
          }}
          className="btn-ghost px-3 py-2 text-xs rounded-xl inline-flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          Message
        </button>
      </div>
    </div>
  )
}



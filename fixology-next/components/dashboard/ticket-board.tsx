'use client'

// components/dashboard/ticket-board.tsx
// Kanban board with drag-and-drop

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TicketCard } from './ticket-card'
import { Ticket } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Ticket {
  id: string
  ticketNumber: string
  deviceBrand: string
  deviceModel?: string | null
  deviceType?: string | null
  customer: {
    firstName: string
    lastName: string
    phone?: string | null
  }
  status: string
  dueAt?: Date | null
  estimatedCost?: number | null
  createdAt: Date
}

interface Column {
  id: string
  title: string
  tickets: Ticket[]
}

interface TicketBoardProps {
  tickets: Ticket[]
  onTicketSelect?: (ticket: Ticket | null) => void
  selectedTicketId?: string | null
  onStatusChange?: (ticketId: string, newStatus: string) => Promise<void>
}

const STATUSES = [
  { id: 'INTAKE', title: 'Intake', color: 'blue' },
  { id: 'DIAGNOSED', title: 'Diagnosed', color: 'purple' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'indigo' },
  { id: 'READY', title: 'Ready', color: 'green' },
  { id: 'PICKED_UP', title: 'Picked Up', color: 'gray' },
]

function ColumnHeader({ column, count }: { column: typeof STATUSES[0]; count: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-white">{column.title}</h3>
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-semibold">
          {count}
        </span>
      </div>
    </div>
  )
}

function SortableTicketCard({
  ticket,
  onClick,
  isSelected,
}: {
  ticket: Ticket
  onClick?: () => void
  isSelected?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Separate click handler from drag listeners
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isDragging && onClick) {
      onClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      <TicketCard ticket={ticket} onClick={undefined} isSelected={isSelected} />
    </div>
  )
}

function BoardColumn({
  column,
  tickets,
  onTicketClick,
  selectedTicketId,
}: {
  column: typeof STATUSES[0]
  tickets: Ticket[]
  onTicketClick: (ticket: Ticket) => void
  selectedTicketId?: string | null
}) {
  const sortableIds = tickets.map((t) => t.id)

  return (
    <div className="flex-shrink-0 w-80">
      <ColumnHeader column={column} count={tickets.length} />
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]">
          {tickets.map((ticket) => (
            <SortableTicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
              isSelected={selectedTicketId === ticket.id}
            />
          ))}
          {tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-white/10">
              <Ticket className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-xs text-white/40">No tickets</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function TicketBoard({
  tickets,
  onTicketSelect,
  selectedTicketId,
  onStatusChange,
}: TicketBoardProps) {
  const [columns, setColumns] = useState<Column[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pinnedTickets, setPinnedTickets] = useState<Ticket[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 1000, // 1 second delay before drag starts
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Organize tickets into columns
  useEffect(() => {
    const organized: Column[] = STATUSES.map((status) => ({
      id: status.id,
      title: status.title,
      tickets: tickets.filter((t) => t.status === status.id),
    }))

    // Separate pinned tickets
    const pinned = tickets.filter((t) => t.status !== 'PICKED_UP' && t.status !== 'CANCELLED')
    setPinnedTickets(pinned.slice(0, 3)) // Show top 3 as "pinned"
    setColumns(organized)
  }, [tickets])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find columns
    const activeColumn = columns.find((col) =>
      col.tickets.some((t) => t.id === activeId)
    )
    const overColumn = columns.find((col) => col.id === overId)

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return
    }

    setColumns((prev) => {
      const newColumns = prev.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tickets: col.tickets.filter((t) => t.id !== activeId),
          }
        }
        if (col.id === overColumn.id) {
          const activeTicket = activeColumn.tickets.find((t) => t.id === activeId)
          if (activeTicket) {
            return {
              ...col,
              tickets: [...col.tickets, { ...activeTicket, status: col.id }],
            }
          }
        }
        return col
      })
      return newColumns
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the ticket and new status
    const activeColumn = columns.find((col) =>
      col.tickets.some((t) => t.id === activeId)
    )
    const overColumn = columns.find((col) => col.id === overId)

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return
    }

    // Update ticket status
    if (onStatusChange) {
      await onStatusChange(activeId, overColumn.id)
    }
  }

  const activeTicket = activeId
    ? tickets.find((t) => t.id === activeId)
    : null

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      {/* Pinned tickets row */}
      {pinnedTickets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-yellow-400 rounded-full" />
            <h3 className="text-sm font-semibold text-white/80">Pinned / Urgent</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {pinnedTickets.map((ticket) => (
              <div key={ticket.id} className="flex-shrink-0 w-64">
                <TicketCard
                  ticket={{ ...ticket, isPinned: true }}
                  onClick={() => onTicketSelect?.(ticket)}
                  isSelected={selectedTicketId === ticket.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={STATUSES.find((s) => s.id === column.id)!}
              tickets={column.tickets}
              onTicketClick={(ticket) => onTicketSelect?.(ticket)}
              selectedTicketId={selectedTicketId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <div className="opacity-90 rotate-3">
              <TicketCard ticket={activeTicket} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}


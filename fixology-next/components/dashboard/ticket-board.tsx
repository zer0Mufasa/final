'use client'

// components/dashboard/ticket-board.tsx
// Kanban board with drag-and-drop

import { useState, useEffect, useRef } from 'react'
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
  useDroppable,
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
  createdAt: Date | string
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

  // Track if this was a click vs drag
  const clickStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    clickStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    }
  }

  // Separate click handler from drag listeners
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if we didn't drag (just clicked)
    if (!isDragging && clickStartRef.current && onClick) {
      const { x, y, time } = clickStartRef.current
      const moved = Math.abs(e.clientX - x) > 5 || Math.abs(e.clientY - y) > 5
      const timeSinceStart = Date.now() - time
      
      // If we didn't move much and it's been less than 200ms, treat as click
      if (!moved && timeSinceStart < 200) {
        e.stopPropagation()
        onClick()
      }
    }
    clickStartRef.current = null
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div {...listeners} style={{ cursor: 'grab' }}>
        <TicketCard ticket={ticket} onClick={undefined} isSelected={isSelected} />
      </div>
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
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-80",
        isOver && "ring-2 ring-purple-500/50 rounded-xl"
      )}
      data-column-id={column.id}
    >
      <ColumnHeader column={column} count={tickets.length} />
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[200px]" data-column-id={column.id}>
          {tickets.map((ticket) => (
            <SortableTicketCard
              key={ticket.id}
              ticket={{
                ...ticket,
                createdAt: ticket.createdAt,
              }}
              onClick={() => onTicketClick(ticket)}
              isSelected={selectedTicketId === ticket.id}
            />
          ))}
          {tickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-white/10" data-column-id={column.id}>
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
  const boardRef = useRef<HTMLDivElement>(null)
  const [isRightClickPanning, setIsRightClickPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, scrollLeft: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after 8px of movement (distinguishes from clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Organize tickets into columns
  useEffect(() => {
    if (!tickets || !Array.isArray(tickets)) {
      setColumns([])
      return
    }

    const organized: Column[] = STATUSES.map((status) => ({
      id: status.id,
      title: status.title,
      tickets: tickets.filter((t) => t.status === status.id),
    }))

    setColumns(organized)
  }, [tickets])

  // Right-click panning handlers
  useEffect(() => {
    const board = boardRef.current
    if (!board) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault() // Prevent context menu
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle right-click (button 2)
      if (e.button === 2) {
        setIsRightClickPanning(true)
        setPanStart({
          x: e.clientX,
          scrollLeft: board.scrollLeft,
        })
        board.style.cursor = 'grabbing'
        board.style.userSelect = 'none'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isRightClickPanning) {
        const deltaX = e.clientX - panStart.x
        board.scrollLeft = panStart.scrollLeft - deltaX
      }
    }

    const handleMouseUp = () => {
      if (isRightClickPanning) {
        setIsRightClickPanning(false)
        if (board) {
          board.style.cursor = ''
          board.style.userSelect = ''
        }
      }
    }

    board.addEventListener('contextmenu', handleContextMenu)
    board.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      board.removeEventListener('contextmenu', handleContextMenu)
      board.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isRightClickPanning, panStart])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the column containing the active ticket
    const activeColumn = columns.find((col) =>
      col.tickets.some((t) => t.id === activeId)
    )

    if (!activeColumn) return

    // Check if dragging over a column (droppable area)
    let targetColumn = columns.find((col) => col.id === overId)
    
    // If not a column, check if dragging over a ticket (to determine target column)
    if (!targetColumn) {
      const overTicket = tickets.find((t) => t.id === overId)
      if (overTicket) {
        targetColumn = columns.find((col) =>
          col.tickets.some((t) => t.id === overId)
        )
      }
    }

    // Also check if dropping on a column container (via data-column-id)
    if (!targetColumn && over.data.current) {
      const containerId = over.data.current.sortable?.containerId
      if (containerId) {
        targetColumn = columns.find((col) => col.id === containerId)
      }
    }

    if (!targetColumn || activeColumn.id === targetColumn.id) {
      return
    }

    // Move ticket to target column
    setColumns((prev) => {
      const newColumns = prev.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tickets: col.tickets.filter((t) => t.id !== activeId),
          }
        }
        if (col.id === targetColumn.id) {
          const activeTicket = activeColumn.tickets.find((t) => t.id === activeId)
          if (activeTicket) {
            // If dragging over a ticket, insert after it; otherwise append to end
            const overTicket = tickets.find((t) => t.id === overId)
            if (overTicket && col.tickets.some((t) => t.id === overId)) {
              const overIndex = col.tickets.findIndex((t) => t.id === overId)
              const newTickets = [...col.tickets]
              newTickets.splice(overIndex + 1, 0, { ...activeTicket, status: col.id })
              return {
                ...col,
                tickets: newTickets,
              }
            } else {
              return {
                ...col,
                tickets: [...col.tickets, { ...activeTicket, status: col.id }],
              }
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

    // Find the column containing the active ticket
    const activeColumn = columns.find((col) =>
      col.tickets.some((t) => t.id === activeId)
    )

    if (!activeColumn) return

    // Check if dropping on a column (via column header or empty area)
    let targetColumn = columns.find((col) => col.id === overId)
    
    // If not a column, check if dropping on a ticket (to get its column)
    if (!targetColumn) {
      const overTicket = tickets.find((t) => t.id === overId)
      if (overTicket) {
        targetColumn = columns.find((col) =>
          col.tickets.some((t) => t.id === overId)
        )
      }
    }

    // Also check if dropping on a column container (via data-column-id)
    if (!targetColumn && over.data.current) {
      const containerId = over.data.current.sortable?.containerId
      if (containerId) {
        targetColumn = columns.find((col) => col.id === containerId)
      }
    }

    if (!targetColumn || activeColumn.id === targetColumn.id) {
      return
    }

    // Update ticket status
    if (onStatusChange) {
      await onStatusChange(activeId, targetColumn.id)
    }
  }

  const activeTicket = activeId
    ? tickets.find((t) => t.id === activeId)
    : null

  return (
    <div ref={boardRef} className="flex-1 overflow-x-auto pb-4" style={{ cursor: isRightClickPanning ? 'grabbing' : 'grab' }}>
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
              <TicketCard 
                ticket={{
                  ...activeTicket,
                  createdAt: activeTicket.createdAt || new Date().toISOString(),
                }} 
                onClick={undefined}
                isSelected={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}


'use client'

import { useState, useRef, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Ticket, TicketStatus } from '@/lib/mock/types'
import { ticketColumns } from '@/lib/mock/data'
import { cn } from '@/lib/utils/cn'
import { ReticleIcon } from '@/components/shared/reticle-icon'
import { TicketCard } from './ticket-card'

export function KanbanBoard({
  tickets,
  setTickets,
}: {
  tickets: Ticket[]
  setTickets: (next: Ticket[] | ((prev: Ticket[]) => Ticket[])) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // Right-click drag-to-pan functionality
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle right-click (button === 2)
      if (e.button === 2 && container.contains(e.target as Node)) {
        e.preventDefault()
        e.stopPropagation()
        isPanningRef.current = true
        startXRef.current = e.clientX
        scrollLeftRef.current = container.scrollLeft
        container.style.cursor = 'grabbing'
        container.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return
      e.preventDefault()
      const deltaX = startXRef.current - e.clientX
      // Moving mouse right (deltaX negative) should scroll right (increase scrollLeft)
      container.scrollLeft = scrollLeftRef.current + deltaX
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current && e.button === 2) {
        isPanningRef.current = false
        container.style.cursor = ''
        container.style.userSelect = ''
        document.body.style.cursor = ''
        e.preventDefault()
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menu when right-clicking on the board
      if (container.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    // Use capture phase to catch events before children
    container.addEventListener('mousedown', handleMouseDown, true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('contextmenu', handleContextMenu)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('contextmenu', handleContextMenu)
      document.body.style.cursor = ''
    }
  }, [])

  const grouped: Record<TicketStatus, Ticket[]> = {
    INTAKE: [],
    DIAGNOSED: [],
    WAITING_PARTS: [],
    IN_REPAIR: [],
    READY: [],
    PICKED_UP: [],
  }
  for (const t of tickets) grouped[t.status].push(t)

  const activeTicket = activeId ? tickets.find((t) => t.id === activeId) || null : null

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeTicket = tickets.find((t) => t.id === String(active.id))
    if (!activeTicket) return

    const overId = String(over.id)
    const overTicket = tickets.find((t) => t.id === overId)
    const nextStatus: TicketStatus | null = overTicket
      ? overTicket.status
      : (ticketColumns.some((c) => c.key === (overId as any)) ? (overId as TicketStatus) : null)

    if (!nextStatus) return
    if (activeTicket.status === nextStatus) return

    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, status: nextStatus } : t)))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div ref={scrollContainerRef} className="overflow-x-auto pb-2 cursor-grab active:cursor-grabbing">
        <div className="flex items-start gap-3 min-w-max">
          {ticketColumns.map((col) => (
            <Column key={col.key} status={col.key} title={col.label} tickets={grouped[col.key]} isDragging={!!activeId} />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rounded-2xl bg-black/60 border border-white/15 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.6)] w-[280px]">
            <div className="text-sm font-extrabold text-white/90">{activeTicket.ticketNumber}</div>
            <div className="text-sm text-white/80 mt-1">{activeTicket.customerName}</div>
            <div className="text-xs text-white/55 mt-0.5">{activeTicket.device}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  status,
  title,
  tickets,
  isDragging,
}: {
  status: TicketStatus
  title: string
  tickets: Ticket[]
  isDragging: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="min-w-[280px] w-[280px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <ReticleIcon size="sm" color="purple" variant={isOver ? 'focus' : 'idle'} className={cn('opacity-70', isOver && 'opacity-95')} />
          </div>
          <div className="text-sm font-semibold text-white/85">{title}</div>
        </div>
        <span className="text-xs text-white/45">{tickets.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'rounded-3xl p-2 border border-white/10 bg-white/[0.02] min-h-[560px]',
          isDragging ? 'ring-1 ring-purple-500/20' : '',
          isOver ? 'border-purple-400/30 bg-purple-500/[0.04] ring-2 ring-purple-500/20' : ''
        )}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}



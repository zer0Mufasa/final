'use client'

// components/dashboard/command-palette.tsx
// Global Cmd+K command palette overlay (UI-only)

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Ticket,
  UserPlus,
  PackagePlus,
  Stethoscope,
  FileText,
  Search,
  Hash,
  Smartphone,
  ArrowRight,
  Clock,
  BarChart3,
} from 'lucide-react'

interface Command {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'create-ticket',
        label: 'Create Ticket',
        category: 'Actions',
        icon: <Ticket className="w-4 h-4" />,
        shortcut: 'T',
        action: () => {
          router.push('/tickets/new')
          onOpenChange(false)
        },
      },
      {
        id: 'add-customer',
        label: 'Add Customer',
        category: 'Actions',
        icon: <UserPlus className="w-4 h-4" />,
        shortcut: 'C',
        action: () => {
          router.push('/customers/new')
          onOpenChange(false)
        },
      },
      {
        id: 'add-part',
        label: 'Add Part to Inventory',
        category: 'Actions',
        icon: <PackagePlus className="w-4 h-4" />,
        shortcut: 'P',
        action: () => {
          router.push('/inventory?add=1')
          onOpenChange(false)
        },
      },
      {
        id: 'run-diagnostic',
        label: 'Run Diagnostic',
        category: 'Actions',
        icon: <Stethoscope className="w-4 h-4" />,
        shortcut: 'D',
        action: () => {
          router.push('/diagnostics?new=1')
          onOpenChange(false)
        },
      },
      {
        id: 'create-invoice',
        label: 'Create Invoice',
        category: 'Actions',
        icon: <FileText className="w-4 h-4" />,
        shortcut: 'I',
        action: () => {
          router.push('/invoices/new')
          onOpenChange(false)
        },
      },
      {
        id: 'find-ticket',
        label: 'Find Ticket #',
        category: 'Search',
        icon: <Hash className="w-4 h-4" />,
        shortcut: 'F',
        action: () => {
          router.push('/tickets')
          onOpenChange(false)
        },
      },
      {
        id: 'check-imei',
        label: 'Check IMEI',
        category: 'Search',
        icon: <Smartphone className="w-4 h-4" />,
        shortcut: 'M',
        action: () => {
          router.push('/diagnostics?imei=1')
          onOpenChange(false)
        },
      },
      {
        id: 'view-reports',
        label: 'View Reports',
        category: 'Navigation',
        icon: <BarChart3 className="w-4 h-4" />,
        shortcut: 'R',
        action: () => {
          router.push('/reports')
          onOpenChange(false)
        },
      },
    ],
    [router, onOpenChange]
  )

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q))
  }, [commands, query])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((idx) => Math.min(idx + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((idx) => Math.max(idx - 1, 0))
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        filteredCommands[selectedIndex].action()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredCommands, onOpenChange])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = []
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4"
      onClick={() => onOpenChange(false)}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative z-[101] w-full max-w-2xl rounded-3xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-white placeholder:text-white/40 text-lg font-medium outline-none"
            autoFocus
          />
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">
            Cmd/Ctrl+K
          </div>
        </div>

        {/* Commands list */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-sm text-white/40">No commands found</div>
              <div className="text-xs text-white/30 mt-1">Try a different search term</div>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">{category}</div>
                <div className="space-y-1">
                  {cmds.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd)
                    const isSelected = globalIdx === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                          isSelected
                            ? 'bg-purple-500/20 text-white border border-purple-400/30'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        )}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        <span className={cn('flex-shrink-0', isSelected ? 'text-purple-300' : 'text-white/50')}>
                          {cmd.icon}
                        </span>
                        <span className="flex-1 font-medium">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/40 font-mono">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && <ArrowRight className="w-4 h-4 text-purple-300 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          <div className="text-white/30">UI only — actions will route</div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { cn } from '@/lib/utils/cn'
import type { Ticket, TicketStatus } from '@/lib/mock/types'
import { ticketColumns, mockTechs } from '@/lib/mock/data'
import {
  Phone,
  Mail,
  MessageSquare,
  User,
  Smartphone,
  Clock,
  Calendar,
  DollarSign,
  Wrench,
  Package,
  FileText,
  Send,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Printer,
  Share2,
  Edit3,
  Trash2,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  const mins = Math.floor(diff / (60 * 1000))
  return `${mins}m ago`
}

function hoursFromNow(iso: string) {
  const d = new Date(iso).getTime()
  const diff = d - Date.now()
  return Math.round(diff / (60 * 60 * 1000))
}

export function TicketDetailDrawer({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  onAssign,
}: {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (ticketId: string, status: TicketStatus) => void
  onAssign?: (ticketId: string, tech: string) => void
}) {
  const [tab, setTab] = useState<'details' | 'timeline' | 'notes'>('details')
  const [copied, setCopied] = useState(false)
  const [newNote, setNewNote] = useState('')

  if (!ticket) return null

  const hrs = hoursFromNow(ticket.promisedAt)
  const isLate = hrs < 0

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticketNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendNote = () => {
    if (!newNote.trim()) return
    // UI-only: would add note to ticket
    console.log('Send note:', newNote)
    setNewNote('')
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={ticket.ticketNumber}
      description={`${ticket.customerName} • ${ticket.device}`}
      className="max-w-[600px]"
    >
      <div className="space-y-6">
        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyTicketNumber}
            className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy #'}
          </button>
          <a
            href={`tel:${ticket.customerPhone.replace(/\D/g, '')}`}
            className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <button className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Text
          </button>
          {ticket.customerEmail && (
            <a
              href={`mailto:${ticket.customerEmail}`}
              className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          )}
          <div className="flex-1" />
          <button className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button className="btn-secondary px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status & Assignment */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="text-xs text-white/50 uppercase tracking-wider">Status</div>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                {ticket.risk !== 'none' && <RiskBadge risk={ticket.risk} />}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/50 uppercase tracking-wider">Assigned To</div>
              <select
                value={ticket.assignedTo || ''}
                onChange={(e) => onAssign?.(ticket.id, e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80"
              >
                <option value="">Unassigned</option>
                {mockTechs.map((tech) => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/50 uppercase tracking-wider">Promise Time</div>
              <div className={cn(
                "text-sm font-semibold",
                isLate ? "text-red-400" : "text-white/80"
              )}>
                {isLate ? `${Math.abs(hrs)}h overdue` : `in ${hrs}h`}
              </div>
            </div>
          </div>

          {/* Status Change Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Change Status</div>
            <div className="flex items-center gap-2 flex-wrap">
              {ticketColumns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => onStatusChange?.(ticket.id, col.key)}
                  disabled={ticket.status === col.key}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    ticket.status === col.key
                      ? "bg-purple-500/30 text-purple-200 border border-purple-500/40"
                      : "bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80"
                  )}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Reasons */}
        {ticket.riskReasons && ticket.riskReasons.length > 0 && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">Risk Flags</span>
            </div>
            <ul className="space-y-1">
              {ticket.riskReasons.map((reason, i) => (
                <li key={i} className="text-sm text-red-300/80 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-400" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as any)}
          tabs={[
            { value: 'details', label: 'Details' },
            { value: 'timeline', label: 'Timeline' },
            { value: 'notes', label: `Notes${ticket.notes?.length ? ` (${ticket.notes.length})` : ''}` },
          ]}
        />

        {/* Tab Content */}
        {tab === 'details' && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white/90">Customer</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/50">Name</div>
                  <div className="text-sm text-white/80">{ticket.customerName}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Phone</div>
                  <div className="text-sm text-white/80">{ticket.customerPhone}</div>
                </div>
                {ticket.customerEmail && (
                  <div className="col-span-2">
                    <div className="text-xs text-white/50">Email</div>
                    <div className="text-sm text-white/80">{ticket.customerEmail}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Device Info */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white/90">Device</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-white/50">Device</div>
                  <div className="text-sm text-white/80">{ticket.device}</div>
                </div>
                {ticket.imei && (
                  <div>
                    <div className="text-xs text-white/50">IMEI</div>
                    <div className="text-sm text-white/80 font-mono">{ticket.imei}</div>
                  </div>
                )}
                {ticket.passcode && (
                  <div>
                    <div className="text-xs text-white/50">Passcode</div>
                    <div className="text-sm text-white/80 font-mono">{ticket.passcode}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Repair Info */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white/90">Repair</span>
              </div>
              <div className="space-y-3">
                {ticket.issue && (
                  <div>
                    <div className="text-xs text-white/50">Issue</div>
                    <div className="text-sm text-white/80">{ticket.issue}</div>
                  </div>
                )}
                {ticket.symptoms && ticket.symptoms.length > 0 && (
                  <div>
                    <div className="text-xs text-white/50">Symptoms</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ticket.symptoms.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-xs text-white/70">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {ticket.diagnosis && (
                  <div>
                    <div className="text-xs text-white/50">Diagnosis</div>
                    <div className="text-sm text-white/80">{ticket.diagnosis}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white/90">Pricing</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-white/50">Total</div>
                  <div className="text-lg font-bold text-white/90">{fmtMoney(ticket.price)}</div>
                </div>
                {ticket.deposit !== undefined && (
                  <div>
                    <div className="text-xs text-white/50">Deposit</div>
                    <div className="text-sm text-white/80">
                      {fmtMoney(ticket.deposit)}
                      {ticket.depositPaid && (
                        <span className="ml-1.5 text-xs text-emerald-400">Paid</span>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-white/50">Balance</div>
                  <div className="text-sm text-white/80">
                    {fmtMoney(ticket.price - (ticket.depositPaid ? (ticket.deposit || 0) : 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Parts Used */}
            {ticket.partsUsed && ticket.partsUsed.length > 0 && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white/90">Parts Used</span>
                </div>
                <div className="space-y-2">
                  {ticket.partsUsed.map((part, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/80">
                        {part.partName}
                        {part.quantity > 1 && <span className="text-white/50"> ×{part.quantity}</span>}
                      </span>
                      <span className="text-white/60">{fmtMoney(part.unitPrice * part.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <div className="space-y-1">
            {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/10" />
                {ticket.statusHistory.map((change, i) => (
                  <div key={i} className="relative pl-6 pb-4">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-purple-500/30 border-2 border-purple-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>
                    <div className="text-xs text-white/50">{fmtDateTime(change.changedAt)}</div>
                    <div className="text-sm text-white/80 mt-0.5">
                      {change.from ? (
                        <>
                          Status changed from <span className="font-semibold">{change.from}</span> to{' '}
                          <span className="font-semibold">{change.to}</span>
                        </>
                      ) : (
                        <>Ticket created as <span className="font-semibold">{change.to}</span></>
                      )}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">by {change.changedBy}</div>
                    {change.note && (
                      <div className="text-xs text-white/60 mt-1 italic">"{change.note}"</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/50 text-center py-8">No timeline events yet</div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            {/* Add Note */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or message..."
                className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/40 resize-none outline-none min-h-[80px]"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-white/60">
                    <input type="checkbox" className="rounded" />
                    Send to customer
                  </label>
                </div>
                <button
                  onClick={handleSendNote}
                  disabled={!newNote.trim()}
                  className="btn-primary px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="space-y-3">
                {ticket.notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "rounded-2xl p-4",
                      note.isInternal
                        ? "bg-white/[0.03] border border-white/10"
                        : "bg-purple-500/10 border border-purple-500/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white/80">{note.author}</span>
                        {!note.isInternal && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/30 text-purple-200">
                            Sent to customer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/50">{timeAgo(note.createdAt)}</span>
                    </div>
                    <div className="text-sm text-white/70">{note.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/50 text-center py-8">No notes yet</div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/10">
          <button className="btn-secondary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1">
            <Edit3 className="w-4 h-4" />
            Edit Ticket
          </button>
          <button className="btn-primary px-4 py-3 rounded-xl text-sm inline-flex items-center gap-2 flex-1">
            <DollarSign className="w-4 h-4" />
            Collect Payment
          </button>
        </div>
      </div>
    </Drawer>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Invoice, InvoiceStatus } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  FileText,
  Plus,
  Printer,
  Send,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Mail,
  MoreHorizontal,
  Trash2,
  Copy,
  Sparkles,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const statusConfig: Record<InvoiceStatus, { label: string; gradient: [string, string]; icon: typeof CheckCircle }> = {
  draft: { label: 'Draft', gradient: ['#64748b', '#475569'], icon: FileText },
  sent: { label: 'Sent', gradient: ['#3b82f6', '#2563eb'], icon: Send },
  viewed: { label: 'Viewed', gradient: ['#8b5cf6', '#7c3aed'], icon: Eye },
  paid: { label: 'Paid', gradient: ['#10b981', '#059669'], icon: CheckCircle },
  partial: { label: 'Partial', gradient: ['#f59e0b', '#d97706'], icon: Clock },
  overdue: { label: 'Overdue', gradient: ['#ef4444', '#dc2626'], icon: AlertTriangle },
  void: { label: 'Void', gradient: ['#6b7280', '#4b5563'], icon: Trash2 },
}

export function InvoicesClient() {
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const [invRes, custRes] = await Promise.all([
          fetch('/api/invoices', { cache: 'no-store' }),
          fetch('/api/customers', { cache: 'no-store' }),
        ])

        if (!invRes.ok) {
          const err = await invRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load invoices')
        }
        if (!custRes.ok) {
          const err = await custRes.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load customers')
        }

        const invData = await invRes.json()
        const custData = await custRes.json()

        if (!cancelled) {
          setInvoices(Array.isArray(invData?.invoices) ? invData.invoices : [])
          const list = Array.isArray(custData?.customers) ? custData.customers : []
          setCustomers(
            list.map((c: any) => ({
              id: c.id,
              name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Customer',
              phone: c.phone || '',
            }))
          )
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load invoices')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setTimeout(() => setAnimationReady(true), 100)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Stats
  const stats = useMemo(() => {
    const thisMonth = invoices.filter((i) => {
      const d = new Date(i.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalBilled = thisMonth.reduce((sum, i) => sum + i.total, 0)
    const collected = thisMonth.reduce((sum, i) => sum + i.amountPaid, 0)
    const outstanding = invoices.reduce((sum, i) => sum + i.amountDue, 0)
    const sentToday = invoices.filter((i) => {
      if (!i.sentAt) return false
      const d = new Date(i.sentAt)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length
    return { totalBilled, collected, outstanding, sentToday }
  }, [invoices])

  // Filtered invoices
  const filtered = useMemo(() => {
    let result = invoices

    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((i) =>
        `${i.invoiceNumber} ${i.customerName} ${i.ticketNumber || ''}`.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [invoices, query, statusFilter])

  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setDrawerOpen(true)
  }

  const upsertInvoiceInState = (inv: Invoice) => {
    setInvoices((prev) => {
      const idx = prev.findIndex((x) => x.id === inv.id)
      if (idx === -1) return [inv, ...prev]
      const next = [...prev]
      next[idx] = inv
      return next
    })
  }

  return (
    <div className="space-y-6 animate-page-in">
      {/* Enhanced Header */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Invoices"
          description="Create, send, and track customer invoices with payment integration."
          action={
            <button
              onClick={() => setBuilderOpen(true)}
              className={cn(
                "group relative px-5 py-3 rounded-xl inline-flex items-center gap-2",
                "text-sm font-semibold text-white",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              )}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Create Invoice
              <Sparkles className="w-3 h-3 opacity-60" />
            </button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4 md:grid-cols-4 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {[
          { label: 'Total Billed', value: fmtMoney(stats.totalBilled), sub: 'this month', icon: DollarSign, gradient: ['#8b5cf6', '#a855f7'] },
          { label: 'Collected', value: fmtMoney(stats.collected), sub: 'this month', icon: CheckCircle, gradient: ['#10b981', '#059669'] },
          { label: 'Outstanding', value: fmtMoney(stats.outstanding), sub: 'balance', icon: Clock, gradient: ['#f59e0b', '#d97706'], warning: stats.outstanding > 0 },
          { label: 'Invoices Sent', value: stats.sentToday.toString(), sub: 'today', icon: Send, gradient: ['#3b82f6', '#2563eb'] },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative rounded-xl p-5 overflow-hidden cursor-pointer",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1"
              )}
              style={{
                background: stat.warning
                  ? `linear-gradient(135deg, ${stat.gradient[0]}15 0%, ${stat.gradient[1]}10 100%)`
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: stat.warning
                  ? `1px solid ${stat.gradient[0]}40`
                  : '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className="w-6 h-6 transition-colors"
                  style={{ color: `${stat.gradient[0]}80` }}
                />
              </div>
              <div className="text-xs text-white/50 mb-1">{stat.label}</div>
              <div
                className="text-2xl font-bold"
                style={{ color: stat.warning ? stat.gradient[0] : 'white' }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-white/40 mt-1">{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className={cn(
        "flex items-center gap-3 flex-wrap transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '150ms' }}>
        <div className="relative flex-1 max-w-[320px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-2.5 rounded-xl",
              "bg-white/[0.03] border border-white/[0.08]",
              "text-sm text-white placeholder:text-white/40",
              "outline-none transition-all duration-300",
              "focus:border-purple-500/50 focus:bg-white/[0.05]",
              "focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
            )}
            placeholder="Search invoice #, customer..."
          />
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Filter className="w-4 h-4 text-white/40" />
          <select
            className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button
          className={cn(
            "px-4 py-2.5 rounded-xl inline-flex items-center gap-2",
            "text-sm text-white/70",
            "transition-all duration-200",
            "hover:bg-white/[0.05] hover:text-white"
          )}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Calendar className="w-4 h-4" />
          Date Range
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        {loading ? (
          <div
            className="p-6 rounded-2xl space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <FileText className="w-7 h-7 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No invoices found</h3>
            <p className="text-sm text-white/50 mb-6">Create your first invoice to start tracking revenue.</p>
            <button
              onClick={() => setBuilderOpen(true)}
              className="px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
              }}
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="text-sm font-semibold text-white/85">
                {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/[0.06]">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, idx) => {
                    const status = statusConfig[inv.status]
                    const StatusIcon = status.icon
                    const isOverdue = inv.status === 'overdue' || (inv.amountDue > 0 && new Date(inv.dueDate) < new Date())
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.03] cursor-pointer"
                        onClick={() => openInvoice(inv)}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{inv.invoiceNumber}</div>
                          {inv.ticketNumber && (
                            <div className="text-xs text-white/50">{inv.ticketNumber}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-white/80">{inv.customerName}</div>
                          <div className="text-xs text-white/50">{inv.customerPhone}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{fmtMoney(inv.total)}</div>
                          {inv.amountPaid > 0 && inv.amountDue > 0 && (
                            <div className="text-xs text-amber-400">{fmtMoney(inv.amountPaid)} paid</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{
                              background: `linear-gradient(135deg, ${status.gradient[0]}20 0%, ${status.gradient[1]}10 100%)`,
                              border: `1px solid ${status.gradient[0]}40`,
                              color: status.gradient[0],
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className={cn(
                            "text-sm font-medium",
                            isOverdue ? "text-red-400" : "text-white/70"
                          )}>
                            {fmtDate(inv.dueDate)}
                          </div>
                          {isOverdue && <div className="text-xs text-red-400">OVERDUE</div>}
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {inv.status === 'draft' && (
                              <button
                                className="px-3 py-2 rounded-lg text-xs font-medium text-white inline-flex items-center gap-1 transition-all hover:scale-105"
                                style={{
                                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                }}
                              >
                                <Send className="w-3 h-3" /> Send
                              </button>
                            )}
                            {(inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'partial') && (
                              <button
                                className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 inline-flex items-center gap-1 transition-all hover:bg-white/[0.08]"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                              >
                                <Mail className="w-3 h-3" /> Remind
                              </button>
                            )}
                            <button
                              className="p-2 rounded-lg transition-all hover:bg-white/[0.08]"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4 text-white/50" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedInvoice?.invoiceNumber || 'Invoice'}
        description={selectedInvoice ? `${selectedInvoice.customerName}` : undefined}
        className="max-w-[600px]"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            {/* Status & Actions */}
            <div className="flex items-center justify-between gap-4">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                style={{
                  background: `linear-gradient(135deg, ${statusConfig[selectedInvoice.status].gradient[0]}20 0%, ${statusConfig[selectedInvoice.status].gradient[1]}10 100%)`,
                  border: `1px solid ${statusConfig[selectedInvoice.status].gradient[0]}40`,
                  color: statusConfig[selectedInvoice.status].gradient[0],
                }}
              >
                {statusConfig[selectedInvoice.status].label}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-xl text-sm text-white/70 inline-flex items-center gap-2 transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onClick={() => {
                    try {
                      window.print()
                    } catch {
                      toast.error('Print not available')
                    }
                  }}
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  className="px-3 py-2 rounded-xl text-sm text-white/70 inline-flex items-center gap-2 transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onClick={async () => {
                    try {
                      const url = `${window.location.origin}/invoices#${selectedInvoice.id}`
                      await navigator.clipboard.writeText(url)
                      toast.success('Invoice link copied')
                    } catch {
                      toast.error('Failed to copy link')
                    }
                  }}
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Bill To</div>
              <div className="text-sm font-semibold text-white">{selectedInvoice.customerName}</div>
              <div className="text-sm text-white/50">{selectedInvoice.customerPhone}</div>
              {selectedInvoice.customerEmail && (
                <div className="text-sm text-white/50">{selectedInvoice.customerEmail}</div>
              )}
            </div>

            {/* Line Items */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Line Items</div>
              <div className="space-y-2">
                {selectedInvoice.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex-1">
                      <div className="text-sm text-white">{item.description}</div>
                      <div className="text-xs text-white/50">
                        {item.quantity} × {fmtMoney(item.unitPrice)}
                        {item.warrantyIncluded && ' • Warranty included'}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">{fmtMoney(item.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{fmtMoney(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Tax ({(selectedInvoice.taxRate * 100).toFixed(2)}%)</span>
                  <span className="text-white">{fmtMoney(selectedInvoice.taxAmount)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Discount</span>
                    <span className="text-emerald-400">-{fmtMoney(selectedInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/[0.08]">
                  <span className="text-white">Total</span>
                  <span className="text-white">{fmtMoney(selectedInvoice.total)}</span>
                </div>
                {selectedInvoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Paid</span>
                      <span className="text-emerald-400">-{fmtMoney(selectedInvoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-amber-400">Balance Due</span>
                      <span className="text-amber-400">{fmtMoney(selectedInvoice.amountDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Notes</div>
                <div className="text-sm text-white/60">{selectedInvoice.notes}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/[0.08]">
              {selectedInvoice.amountDue > 0 && (
                <button
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                  }}
                  onClick={async () => {
                    const raw = window.prompt('Payment amount (USD):', String(selectedInvoice.amountDue))
                    if (!raw) return
                    const amt = Number(raw)
                    if (!Number.isFinite(amt) || amt <= 0) return toast.error('Enter a valid amount')
                    try {
                      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: amt, method: 'CASH' }),
                      })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to record payment')
                      }
                      const next = await fetch(`/api/invoices/${selectedInvoice.id}`, { cache: 'no-store' })
                      const data = await next.json()
                      if (data?.invoice) {
                        setSelectedInvoice(data.invoice)
                        upsertInvoiceInState(data.invoice)
                      }
                      toast.success('Payment recorded')
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to record payment')
                    }
                  }}
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              )}
              <button
                className="flex-1 px-4 py-3 rounded-xl text-sm text-white/70 inline-flex items-center justify-center gap-2 transition-all hover:bg-white/[0.08]"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/invoices/${selectedInvoice.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'sent' }),
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err?.error || 'Failed to send invoice')
                    }
                    const data = await res.json()
                    const nextInv = data?.invoice
                    if (nextInv) {
                      setSelectedInvoice(nextInv)
                      upsertInvoiceInState(nextInv)
                    }
                    toast.success(selectedInvoice.status === 'draft' ? 'Invoice sent' : 'Reminder sent')
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to send')
                  }
                }}
              >
                <Send className="w-4 h-4" />
                {selectedInvoice.status === 'draft' ? 'Send Invoice' : 'Send Reminder'}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Invoice Builder Drawer */}
      <Drawer
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        title="Create Invoice"
        description="Generate a new invoice for a customer"
        className="max-w-[700px]"
      >
        <InvoiceBuilder
          customers={customers}
          onClose={() => setBuilderOpen(false)}
          onCreated={(inv) => {
            upsertInvoiceInState(inv)
            toast.success(`Invoice created (${inv.invoiceNumber})`)
          }}
        />
      </Drawer>
    </div>
  )
}

// Invoice Builder Component
function InvoiceBuilder({
  onClose,
  customers,
  onCreated,
}: {
  onClose: () => void
  customers: Array<{ id: string; name: string; phone: string }>
  onCreated: (inv: Invoice) => void
}) {
  const [customer, setCustomer] = useState('')
  const [items, setItems] = useState<{ type: string; description: string; qty: number; price: number }[]>([
    { type: 'part', description: '', qty: 1, price: 0 },
  ])
  const [taxRate] = useState(0.0825)
  const [notes, setNotes] = useState('Thank you for choosing Fixology! 90-day warranty included on all repairs.')
  const [dueDate, setDueDate] = useState('7')
  const [saving, setSaving] = useState(false)

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0)
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100
  const total = subtotal + taxAmount

  const addItem = () => {
    setItems([...items, { type: 'labor', description: '', qty: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Customer</label>
        <select
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl",
            "bg-white/[0.03] border border-white/[0.08]",
            "text-sm text-white",
            "outline-none cursor-pointer"
          )}
        >
          <option value="">Select customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} • {c.phone}</option>
          ))}
        </select>
      </div>

      {/* Line Items */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-white/40 uppercase tracking-wider">Line Items</div>
          <button
            onClick={addItem}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 inline-flex items-center gap-1 transition-all hover:bg-white/[0.08]"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[80px_1fr_60px_80px_40px] gap-2 items-center">
              <select
                value={item.type}
                onChange={(e) => updateItem(index, 'type', e.target.value)}
                className="px-2 py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.08] text-white outline-none"
              >
                <option value="part">Part</option>
                <option value="labor">Labor</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
              <input
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Description"
                className="px-3 py-2 rounded-lg text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 outline-none"
              />
              <input
                type="number"
                value={item.qty}
                onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                className="px-2 py-2 rounded-lg text-sm text-center bg-white/[0.03] border border-white/[0.08] text-white outline-none"
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                placeholder="$0"
                className="px-2 py-2 rounded-lg text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 outline-none"
              />
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white">{fmtMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Tax (8.25%)</span>
            <span className="text-white">{fmtMoney(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/[0.08]">
            <span className="text-white">Total</span>
            <span className="text-white">{fmtMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Due Date</label>
        <select
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl",
            "bg-white/[0.03] border border-white/[0.08]",
            "text-sm text-white",
            "outline-none cursor-pointer"
          )}
        >
          <option value="0">Due on Receipt</option>
          <option value="7">Net 7 (7 days)</option>
          <option value="14">Net 14 (14 days)</option>
          <option value="30">Net 30 (30 days)</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl p-4 text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 outline-none min-h-[100px] focus:border-purple-500/50 transition-colors"
          placeholder="Notes to customer..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.08]">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl text-sm text-white/70 transition-all hover:bg-white/[0.08]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          Cancel
        </button>
        <button
          className="flex-1 px-4 py-3 rounded-xl text-sm text-white/70 inline-flex items-center justify-center gap-2 transition-all hover:bg-white/[0.08]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          disabled={saving}
          onClick={async () => {
            if (!customer) return toast.error('Select a customer')
            if (saving) return
            setSaving(true)
            try {
              const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: customer,
                  taxRate,
                  discount: 0,
                  notes,
                  dueAt: Number(dueDate) > 0 ? new Date(Date.now() + Number(dueDate) * 86400000).toISOString() : null,
                  status: 'draft',
                  items: items.map((i) => ({
                    description: i.description,
                    quantity: i.qty,
                    unitPrice: i.price,
                  })),
                }),
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to save draft')
              }
              const data = await res.json()
              if (data?.invoice) onCreated(data.invoice)
              onClose()
            } catch (e: any) {
              toast.error(e?.message || 'Failed to save draft')
            } finally {
              setSaving(false)
            }
          }}
        >
          <FileText className="w-4 h-4" /> Save Draft
        </button>
        <button
          className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
          }}
          disabled={saving}
          onClick={async () => {
            if (!customer) return toast.error('Select a customer')
            if (saving) return
            setSaving(true)
            try {
              const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customerId: customer,
                  taxRate,
                  discount: 0,
                  notes,
                  dueAt: Number(dueDate) > 0 ? new Date(Date.now() + Number(dueDate) * 86400000).toISOString() : null,
                  status: 'sent',
                  items: items.map((i) => ({
                    description: i.description,
                    quantity: i.qty,
                    unitPrice: i.price,
                  })),
                }),
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error || 'Failed to send invoice')
              }
              const data = await res.json()
              if (data?.invoice) onCreated(data.invoice)
              onClose()
            } catch (e: any) {
              toast.error(e?.message || 'Failed to send invoice')
            } finally {
              setSaving(false)
            }
          }}
        >
          <Send className="w-4 h-4" /> Send Invoice
        </button>
      </div>
    </div>
  )
}

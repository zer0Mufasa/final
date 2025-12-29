'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Plus, Printer, Send } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
type Invoice = {
  id: string
  number: string
  customer: string
  createdAt: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  lines: { name: string; qty: number; price: number }[]
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const mockInvoices: Invoice[] = [
  {
    id: 'inv_5001',
    number: 'INV-2107',
    customer: 'Jordan Lee',
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    subtotal: 228,
    tax: 18,
    total: 246,
    lines: [
      { name: 'Screen replacement', qty: 1, price: 219 },
      { name: 'Adhesive kit', qty: 1, price: 9 },
    ],
  },
  {
    id: 'inv_5002',
    number: 'INV-2106',
    customer: 'Maya Patel',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'PAID',
    subtotal: 149,
    tax: 12,
    total: 161,
    lines: [{ name: 'Battery replacement', qty: 1, price: 149 }],
  },
]

export function InvoicesClient() {
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(mockInvoices[0]?.id || null)
  const [builder, setBuilder] = useState({
    customer: 'Jordan Lee',
    due: 'Today',
    notes: 'Thanks for choosing Fixology. Reply with any questions.',
    lines: [
      { name: 'Screen replacement', qty: 1, price: 219 },
      { name: 'Adhesive kit', qty: 1, price: 9 },
    ],
    taxRate: 0.08,
  })

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const selected = useMemo(() => mockInvoices.find((i) => i.id === selectedId) || null, [selectedId])

  const subtotal = useMemo(() => builder.lines.reduce((s, l) => s + l.qty * l.price, 0), [builder.lines])
  const tax = useMemo(() => Math.round(subtotal * builder.taxRate * 100) / 100, [subtotal, builder.taxRate])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Build clean invoices that feel premium: clear line items, polished preview, and fast send actions (UI-only for now)."
        action={
          <Button leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />} rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}>
            New Invoice
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[520px] rounded-3xl" />
          <Skeleton className="h-[520px] rounded-3xl lg:col-span-2" />
        </div>
      ) : mockInvoices.length === 0 ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<FileText className="w-8 h-8" aria-hidden="true" />}
            title="No invoices yet"
            description="Create an invoice to start tracking revenue and sending receipts."
            cta={<button className="btn-primary px-5 py-3 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" aria-hidden="true" />New Invoice</button>}
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* List */}
          <GlassCard className="p-0 overflow-hidden rounded-3xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-semibold text-white/85">Invoice list</div>
              <div className="text-xs text-white/45">{mockInvoices.length} total</div>
            </div>
            <div className="p-3 space-y-2">
              {mockInvoices.map((inv) => {
                const active = inv.id === selectedId
                const badge =
                  inv.status === 'PAID'
                    ? 'bg-green-500/20 text-green-300'
                    : inv.status === 'SENT'
                    ? 'bg-blue-500/20 text-blue-300'
                    : inv.status === 'OVERDUE'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-white/5 text-white/55 border border-white/10'
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={cn(
                      'w-full text-left rounded-2xl border px-4 py-3 transition-colors',
                      active ? 'bg-white/[0.06] border-white/15' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/90 truncate">{inv.number}</div>
                        <div className="text-xs text-white/55 mt-1 truncate">{inv.customer} • {new Date(inv.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white/85">{fmtMoney(inv.total)}</div>
                        <span className={cn('badge mt-1', badge)}>{inv.status}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </GlassCard>

          {/* Builder + Preview */}
          <GlassCard className="rounded-3xl lg:col-span-2 p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/90">Invoice builder</div>
                <div className="text-xs text-white/50 mt-0.5">UI-only — no PDF generation yet.</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  Print (UI)
                </button>
                <button className="btn-primary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Send (UI)
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">
              {/* Form */}
              <div className="p-5 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="grid gap-4">
                  <div>
                    <label className="label">Customer</label>
                    <input className="input bg-white/[0.04] border-white/10" value={builder.customer} onChange={(e) => setBuilder((p) => ({ ...p, customer: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Due</label>
                    <select className="select bg-white/[0.04] border-white/10" value={builder.due} onChange={(e) => setBuilder((p) => ({ ...p, due: e.target.value }))}>
                      <option>Today</option>
                      <option>Net 7</option>
                      <option>Net 14</option>
                    </select>
                  </div>

                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="text-sm font-semibold text-white/85">Line items</div>
                    <div className="mt-3 space-y-2">
                      {builder.lines.map((l, idx) => (
                        <div key={idx} className="grid grid-cols-[1.4fr_.6fr_.7fr] gap-2">
                          <input className="input bg-white/[0.04] border-white/10" value={l.name} onChange={(e) => setBuilder((p) => ({ ...p, lines: p.lines.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) }))} />
                          <input className="input bg-white/[0.04] border-white/10" value={String(l.qty)} onChange={(e) => setBuilder((p) => ({ ...p, lines: p.lines.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value || 0) } : x)) }))} />
                          <input className="input bg-white/[0.04] border-white/10" value={String(l.price)} onChange={(e) => setBuilder((p) => ({ ...p, lines: p.lines.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value || 0) } : x)) }))} />
                        </div>
                      ))}
                      <button
                        className="btn-secondary px-4 py-2 rounded-xl text-sm w-full"
                        onClick={() => setBuilder((p) => ({ ...p, lines: [...p.lines, { name: 'Labor', qty: 1, price: 0 }] }))}
                      >
                        Add line
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Notes</label>
                    <textarea className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[120px]" value={builder.notes} onChange={(e) => setBuilder((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-5">
                <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-white/90 tracking-tight">Fixology</div>
                      <div className="text-xs text-white/45 mt-1">Invoice preview (UI)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white/85">{selected?.number || 'INV-NEW'}</div>
                      <div className="text-xs text-white/45 mt-1">Due: {builder.due}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">Bill to</div>
                    <div className="text-sm font-semibold text-white/85 mt-1">{builder.customer}</div>
                    <div className="text-xs text-white/45 mt-1">—</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-wider text-white/45 font-semibold mb-2">Line items</div>
                    <div className="space-y-2">
                      {builder.lines.map((l, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-sm text-white/80">
                          <div className="min-w-0 truncate">{l.qty}× {l.name}</div>
                          <div className="font-semibold text-white/85">{fmtMoney(l.qty * l.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Subtotal</span>
                      <span className="font-semibold text-white/85">{fmtMoney(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Tax (est.)</span>
                      <span className="font-semibold text-white/85">{fmtMoney(tax)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Total</span>
                      <span className="text-lg font-extrabold text-white">{fmtMoney(total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4 text-xs text-white/55 leading-relaxed">
                    {builder.notes}
                  </div>
                </div>

                <div className="mt-3 text-xs text-white/45">
                  PDF preview is UI-only — we’ll wire real PDF generation later.
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}



'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { mockTickets } from '@/lib/mock/data'
import { PaymentMethodButtons } from '@/components/payments/PaymentMethodButtons'
import { PaymentStatusPill } from '@/components/payments/PaymentStatusPill'
import { LineItemsList } from '@/components/payments/LineItemsList'
import { useRole } from '@/contexts/role-context'
import {
  ArrowRight,
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  MoreVertical,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  DollarSign,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function TicketSimple({ id }: { id: string }) {
  const role = useRole()
  const ticket = useMemo(() => mockTickets.find((t) => t.id === id) || mockTickets[0], [id])
  const [method, setMethod] = useState('cash')

  const lineItems = [
    { name: 'Screen replacement', qty: 1, price: 219, note: 'Grade-A OLED' },
    { name: 'Adhesive kit', qty: 1, price: 9 },
    { name: 'Labor', qty: 1, price: 80, note: 'Diagnostic + install' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-white/50">Ticket Simple</div>
          <h1 className="text-2xl font-bold text-white">{ticket.ticketNumber} • {ticket.customerName}</h1>
          <div className="flex items-center gap-2 text-sm text-white/70 mt-1">
            <span>{ticket.device}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 text-xs">On track</span>
          </div>
        </div>
        <Link href={`/tickets/${id}/overview`} className="btn-secondary px-4 py-2 rounded-xl inline-flex items-center gap-2 text-sm">
          Open Full Overview
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs text-white/60">
        <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/40 transition">Send update</button>
        <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/40 transition">Mark ready</button>
        <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/40 transition">Request approval</button>
        <button className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/40 transition">Add deposit</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Left column */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-white/50">Device Information</p>
                <p className="text-sm font-semibold text-white/90">Linked devices</p>
              </div>
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </div>
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/40" placeholder="Search for device…" />
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{ticket.device}</p>
                  <p className="text-xs text-white/50">Serial: — • Password: —</p>
                </div>
                <div className="text-xs text-white/60">Status: In repair</div>
              </div>
              <p className="text-xs text-white/45 mt-2">+2 more (collapsed)</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Ticket {ticket.ticketNumber}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/5 text-white/70 text-xs">{ticket.status}</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/40" placeholder="Search for item…" />
            </div>
            <div className="space-y-2 text-sm text-white/80">
              {[
                { name: 'Screen replacement', cat: 'Display', sku: 'SCR-14PRO', qty: 1, price: 219, tax: 0 },
                { name: 'Adhesive kit', cat: 'Adhesive', sku: 'ADH-001', qty: 1, price: 9, tax: 0 },
              ].map((i) => (
                <div key={i.sku} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{i.name}</p>
                    <p className="text-xs text-white/55 truncate">{i.cat} • {i.sku}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/65">
                    <span>Qty {i.qty}</span>
                    <span>{fmtMoney(i.price)}</span>
                    <span>Tax {fmtMoney(i.tax)}</span>
                    <div className="flex items-center gap-1 text-white/50">
                      <Edit3 className="w-4 h-4" />
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Item
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Notes</p>
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add note</button>
            </div>
            <div className="text-sm text-white/70 space-y-1">
              <p>Last note: “Customer approved $246, wants rush.”</p>
              <p className="text-xs text-white/50">Tap to expand history.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Appointments</p>
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2"><Calendar className="w-4 h-4" /> Set appointment</button>
            </div>
            <p className="text-xs text-white/50">No appointment set. Add one if needed.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <details className="p-4 border-b border-white/10">
              <summary className="text-sm font-semibold text-white cursor-pointer">Devices & Storage</summary>
              <p className="text-sm text-white/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
            <details className="p-4 border-b border-white/10">
              <summary className="text-sm font-semibold text-white cursor-pointer">Estimates</summary>
              <p className="text-sm text-white/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
            <details className="p-4">
              <summary className="text-sm font-semibold text-white cursor-pointer">Shipping & Tracking</summary>
              <p className="text-sm text-white/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
          </section>
        </div>

        {/* Right column: Payment hero */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Payment</p>
              <PaymentStatusPill state="UNPAID" />
            </div>
            <PaymentMethodButtons value={method} onChange={setMethod} />
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white/70">
              {method === 'card' ? (
                <p>Card: tap / insert / manual entry (UI placeholder).</p>
              ) : method === 'other' ? (
                <p>Other: select provider (CashApp, Apple Pay, Venmo, PayPal, Zelle…) + note.</p>
              ) : method === 'acima' ? (
                <p>Acima: New Application / Quick Apply / Recent (UI-only modal placeholder).</p>
              ) : (
                <p>Amount + optional note. {role === 'TECH' ? 'Read-only for techs.' : ''}</p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <LineItemsList items={lineItems} />
              <div className="pt-3 border-t border-white/10 text-sm text-white/80 space-y-1">
                <div className="flex justify-between"><span>Discount</span><span>$0.00</span></div>
                <div className="flex justify-between"><span>Tips</span><span>$0.00</span></div>
                <div className="flex justify-between font-semibold text-white"><span>Total due</span><span>{fmtMoney(308)}</span></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm">Print</button>
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm">Save</button>
              <button className="btn-secondary px-3 py-2 rounded-xl text-sm">Close</button>
              <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-red-200 hover:border-red-400/40">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Ticket health</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs">
              <CheckCircle2 className="w-3 h-3" /> On track
            </div>
            <div className="text-xs text-white/50">Shows simple status without clutter.</div>
          </div>
        </div>
      </div>
    </div>
  )
}


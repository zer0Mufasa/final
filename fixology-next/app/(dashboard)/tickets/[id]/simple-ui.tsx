'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { mockTickets } from '@/lib/mock/data'
import { useRole } from '@/contexts/role-context'
import { searchDevices } from '@/lib/devices-autocomplete'
import {
  ArrowRight,
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
  X,
  ChevronDown,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

type PayMethod = 'cash' | 'card' | 'other' | 'acima' | 'store_credit'

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'brand'
}) {
  const map = {
    neutral: 'bg-white/5 text-white/70 border-white/10',
    good: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20',
    warn: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
    bad: 'bg-red-500/15 text-red-200 border-red-400/20',
    brand: 'bg-purple-500/20 text-purple-100 border-purple-400/25',
  }
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs ${map[tone]}`}>
      {children}
    </span>
  )
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {subtitle ? <p className="text-xs text-white/50 mt-0.5">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function MethodButton({
  active,
  icon,
  label,
  onClick,
  disabled,
}: {
  active?: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        'w-full rounded-xl border px-3 py-2 text-sm inline-flex items-center justify-between gap-2 transition',
        active
          ? 'bg-purple-500/20 border-purple-400/40 text-white'
          : 'bg-white/[0.04] border-white/10 text-white/75 hover:border-purple-400/30',
        disabled ? 'opacity-50 cursor-not-allowed hover:border-white/10' : '',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-white/70">{icon}</span>
        {label}
      </span>
      {active ? <Pill tone="brand">Selected</Pill> : null}
    </button>
  )
}

export default function TicketSimple({ id }: { id: string }) {
  const role = useRole()
  const ticket = useMemo(() => mockTickets.find((t) => t.id === id) || mockTickets[0], [id])

  // UI-only state
  const [payDrawerOpen, setPayDrawerOpen] = useState(false)
  const [method, setMethod] = useState<PayMethod>('cash')
  const [amount, setAmount] = useState<string>('')
  const [deviceQuery, setDeviceQuery] = useState('')
  const [selectedDevices, setSelectedDevices] = useState<
    { id: string; name: string; imei: string; passcode: string }
  >(() => [
    { id: 'primary', name: ticket.device, imei: '', passcode: '' },
  ])

  const canTakePayment = role !== 'TECH' // front desk + owner
  const lineItems = [
    { name: 'Screen replacement', cat: 'Repair', sku: 'SCR-14PRO', qty: 1, price: 219, tax: 0 },
    { name: 'Adhesive kit', cat: 'Part', sku: 'ADH-001', qty: 1, price: 9, tax: 0 },
    { name: 'Labor', cat: 'Service', sku: 'LAB-STD', qty: 1, price: 80, tax: 0 },
  ]

  const subtotal = lineItems.reduce((s, i) => s + i.qty * i.price, 0)
  const tax = lineItems.reduce((s, i) => s + i.tax, 0)
  const discount = 0
  const tips = 0
  const amountPaid = 0
  const totalDue = Math.max(0, subtotal + tax + tips - discount - amountPaid)

  return (
    <div className="space-y-4">
      {/* Command Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-white/50">Ticket</div>
            <h1 className="text-2xl font-bold text-white truncate">
              {ticket.ticketNumber} • {ticket.customerName}
            </h1>

            <div className="flex items-center gap-2 flex-wrap text-xs mt-2">
              <Pill tone="brand">
                <ShieldCheck className="w-3.5 h-3.5" />
                {ticket.status || 'In Progress'}
              </Pill>
              <Pill tone="neutral">{ticket.device}</Pill>
              <Pill tone={totalDue > 0 ? 'warn' : 'good'}>
                <DollarSign className="w-3.5 h-3.5" />
                Due {fmtMoney(totalDue)}
              </Pill>
              <Pill tone="good">On track</Pill>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm"
            >
              Send update
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm"
            >
              Mark ready
            </button>

            <button
              onClick={() => setPayDrawerOpen(true)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition',
                canTakePayment
                  ? 'bg-purple-500/70 hover:bg-purple-500/80 text-white'
                  : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed',
              ].join(' ')}
              disabled={!canTakePayment}
              title={!canTakePayment ? 'Tech role is read-only for payments (UI rule).' : undefined}
            >
              <CreditCard className="w-4 h-4" />
              Take Payment
            </button>

            <Link
              href={`/tickets/${id}/overview`}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition inline-flex items-center gap-2 text-sm"
            >
              Full Overview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_0.95fr]">
        {/* Work Canvas */}
        <div className="space-y-4">
          <Section
            title="Device"
            subtitle="Keep it simple. One device visible, collapse extras."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            }
          >
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={deviceQuery}
                onChange={(e) => setDeviceQuery(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-purple-400/35"
                placeholder="Search for device…"
              />
            </div>

            {deviceQuery.trim().length > 0 && (
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.02] max-h-48 overflow-y-auto">
                {searchDevices(deviceQuery, 10).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDeviceQuery(d)
                      setSelectedDevices((list) => [
                        ...list,
                        { id: `${Date.now()}-${Math.random()}`, name: d, imei: '', passcode: '' },
                      ])
                      // clear search and collapse list after selection
                      setDeviceQuery('')
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 space-y-2">
              {selectedDevices.map((d, idx) => (
                <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{d.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">Primary device #{idx + 1}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone="brand">Waiting for Diagnosis</Pill>
                      {/* allow delete even on first device if more than one exists */}
                      {selectedDevices.length > 1 && (
                        <button
                          onClick={() => setSelectedDevices((list) => list.filter((x) => x.id !== d.id))}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-red-200 hover:border-red-400/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-white/60 space-y-1">
                      <span className="block">IMEI / Serial</span>
                      <input
                        value={d.imei}
                        onChange={(e) =>
                          setSelectedDevices((list) =>
                            list.map((x) => (x.id === d.id ? { ...x, imei: e.target.value } : x))
                          )
                        }
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-purple-400/35"
                        placeholder="Enter IMEI/serial"
                      />
                    </label>
                    <label className="text-xs text-white/60 space-y-1">
                      <span className="block">Passcode</span>
                      <input
                        value={d.passcode}
                        onChange={(e) =>
                          setSelectedDevices((list) =>
                            list.map((x) => (x.id === d.id ? { ...x, passcode: e.target.value } : x))
                          )
                        }
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-purple-400/35"
                        placeholder="If provided"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Line Items"
            subtitle="The list you ring up and repair from."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Item
              </button>
            }
          >
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-purple-400/35"
                placeholder="Search for item…"
              />
            </div>

            <div className="mt-3 space-y-2">
              {lineItems.map((i) => (
                <div
                  key={i.sku}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{i.name}</p>
                    <p className="text-xs text-white/55 truncate">
                      {i.cat} • {i.sku}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/65">
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">Qty {i.qty}</span>
                    <span className="tabular-nums">{fmtMoney(i.qty * i.price)}</span>
                    <div className="flex items-center gap-2 text-white/50">
                      <button className="hover:text-white/70">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="hover:text-red-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/60">Subtotal</span>
                    <span className="tabular-nums">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Tax</span>
                    <span className="tabular-nums">{fmtMoney(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Discount</span>
                    <span className="tabular-nums">{fmtMoney(discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Tips</span>
                    <span className="tabular-nums">{fmtMoney(tips)}</span>
                  </div>
                  <div className="col-span-2 flex justify-between pt-2 border-t border-white/10 font-semibold text-white">
                    <span>Total Due</span>
                    <span className="tabular-nums">{fmtMoney(totalDue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Dock */}
        <div className="space-y-4">
          <Section
            title="Notes"
            subtitle="Keep the latest visible. Expand for history."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            }
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start gap-2">
                <MessageSquareText className="w-4 h-4 text-white/50 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-white/80">
                    “Customer approved {fmtMoney(subtotal + tax)}. Wants rush if possible.”
                  </p>
                  <p className="text-xs text-white/50 mt-1">Dec 27, 2025 • 12:06 PM</p>
                </div>
              </div>
              <button className="mt-2 text-xs text-white/50 hover:text-white/70 inline-flex items-center gap-1">
                <ChevronDown className="w-3.5 h-3.5" />
                View full history
              </button>
            </div>
          </Section>

          <Section
            title="Appointment"
            subtitle="Only show this if needed."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Set
              </button>
            }
          >
            <p className="text-sm text-white/60">No appointment set.</p>
          </Section>

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

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Actions</p>
              <Pill tone={canTakePayment ? 'neutral' : 'warn'}>{canTakePayment ? 'Front Desk/Owner' : 'Tech view'}</Pill>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm">
                Print
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm">
                Save
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/75 hover:border-purple-400/30 transition text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Drawer */}
      {payDrawerOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPayDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-white/10 bg-[#0b0a12]/95 backdrop-blur-xl p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-white/50">Payment</p>
                <p className="text-lg font-semibold text-white">
                  {ticket.ticketNumber} • Due {fmtMoney(totalDue)}
                </p>
                <p className="text-xs text-white/50 mt-1">UI-only drawer. Functionality later.</p>
              </div>
              <button
                onClick={() => setPayDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:border-purple-400/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <MethodButton
                active={method === 'cash'}
                icon={<DollarSign className="w-4 h-4" />}
                label="Cash"
                onClick={() => setMethod('cash')}
                disabled={!canTakePayment}
              />
              <MethodButton
                active={method === 'card'}
                icon={<CreditCard className="w-4 h-4" />}
                label="Card"
                onClick={() => setMethod('card')}
                disabled={!canTakePayment}
              />
              <MethodButton
                active={method === 'other'}
                icon={<span className="text-xs font-bold">⋯</span>}
                label="Other (CashApp, Apple Pay, Venmo…) "
                onClick={() => setMethod('other')}
                disabled={!canTakePayment}
              />
              <MethodButton
                active={method === 'acima'}
                icon={<span className="text-xs font-bold">A</span>}
                label="Acima"
                onClick={() => setMethod('acima')}
                disabled={!canTakePayment}
              />
              <MethodButton
                active={method === 'store_credit'}
                icon={<span className="text-xs font-bold">SC</span>}
                label="Store Credit"
                onClick={() => setMethod('store_credit')}
                disabled={!canTakePayment}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Amount</p>
                <p className="text-xs text-white/50 mt-1">
                  Default should suggest “Total Due”, but keep editable.
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(totalDue.toFixed(2))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/40 focus:outline-none focus:border-purple-400/35"
                    disabled={!canTakePayment}
                  />
                  <button
                    className={[
                      'px-3 py-2 rounded-xl text-sm font-semibold border transition',
                      canTakePayment
                        ? 'bg-purple-500/70 border-purple-400/30 text-white hover:bg-purple-500/80'
                        : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed',
                    ].join(' ')}
                    disabled={!canTakePayment}
                  >
                    Submit
                  </button>
                </div>

                <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-white/70">
                  {method === 'card' ? (
                    <p>Card UI: Tap / Insert / Manual entry (placeholder).</p>
                  ) : method === 'acima' ? (
                    <p>Acima UI: New Application / Quick Apply / Recent (placeholder).</p>
                  ) : method === 'other' ? (
                    <p>Other UI: Provider dropdown + note (placeholder).</p>
                  ) : (
                    <p>Cash/Store credit: confirm amount + optional note (placeholder).</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">Summary</p>
                <div className="mt-2 space-y-1 text-sm text-white/75">
                  <div className="flex justify-between">
                    <span className="text-white/55">Subtotal</span>
                    <span className="tabular-nums">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Tax</span>
                    <span className="tabular-nums">{fmtMoney(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Discount</span>
                    <span className="tabular-nums">{fmtMoney(discount)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between font-semibold text-white">
                    <span>Total Due</span>
                    <span className="tabular-nums">{fmtMoney(totalDue)}</span>
                  </div>
                </div>
              </div>

              {!canTakePayment ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Tech role is locked from payments in UI mode. Switch to Front Desk/Owner.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


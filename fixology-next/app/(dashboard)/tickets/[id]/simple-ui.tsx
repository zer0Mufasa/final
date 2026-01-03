'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { mockTickets } from '@/lib/mock/data'
import { useRole } from '@/contexts/role-context'
import { searchDevices } from '@/lib/devices-autocomplete'
import { theme } from '@/lib/theme/tokens'
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
import { DataRow } from '@/components/ui/data-row'

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
  const classMap = {
    neutral: 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-default)]',
    good: 'bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]',
    warn: 'bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]',
    bad: 'bg-[var(--status-error-bg)] text-[var(--status-error)] border-[var(--status-error-border)]',
    brand: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium',
        classMap[tone]
      )}
    >
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
    <section
      className="rounded-2xl p-4 transition-all duration-150 bg-[var(--bg-card)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {subtitle ? <p className="text-xs mt-0.5 text-[var(--text-muted)]">{subtitle}</p> : null}
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
          ? 'bg-purple-500/20 border-purple-400/40 text-[var(--text-primary)]'
          : 'bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30',
        disabled ? 'opacity-50 cursor-not-allowed hover:border-[var(--border-default)]' : '',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-2">
        <span className="text-[var(--text-secondary)]">{icon}</span>
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
      <div className="rounded-2xl border border-[var(--border-default)] bg-white/[0.03] p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-[var(--text-muted)]">Ticket</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">
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
              className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm"
            >
              Send update
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm"
            >
              Mark ready
            </button>

            <button
              onClick={() => setPayDrawerOpen(true)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition',
                canTakePayment
                  ? 'bg-purple-500/70 hover:bg-purple-500/80 text-[var(--text-primary)]'
                  : 'bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/40 cursor-not-allowed',
              ].join(' ')}
              disabled={!canTakePayment}
              title={!canTakePayment ? 'Tech role is read-only for payments (UI rule).' : undefined}
            >
              <CreditCard className="w-4 h-4" />
              Take Payment
            </button>

            <Link
              href={`/tickets/${id}/overview`}
              className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition inline-flex items-center gap-2 text-sm"
            >
              Full Overview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr] items-start">
        {/* Work Canvas */}
        <div className="space-y-4">
          <Section
            title="Device"
            subtitle="Keep it simple. One device visible, collapse extras."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            }
          >
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={deviceQuery}
                onChange={(e) => setDeviceQuery(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)]/80 placeholder:text-[var(--text-primary)]/40 focus:outline-none focus:border-purple-400/35"
                placeholder="Search for device…"
              />
            </div>

            {deviceQuery.trim().length > 0 && (
              <div className="mt-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] max-h-48 overflow-y-auto">
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
                    className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)]/80 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 space-y-2">
              {selectedDevices.map((d, idx) => (
                <div key={d.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{d.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Primary device #{idx + 1}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone="brand">Waiting for Diagnosis</Pill>
                      {/* allow delete even on first device if more than one exists */}
                      {selectedDevices.length > 1 && (
                        <button
                          onClick={() => setSelectedDevices((list) => list.filter((x) => x.id !== d.id))}
                          className="p-2 rounded-lg bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/60 hover:text-red-200 hover:border-red-400/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-[var(--text-primary)]/60 space-y-1">
                      <span className="block">IMEI / Serial</span>
                      <input
                        value={d.imei}
                        onChange={(e) =>
                          setSelectedDevices((list) =>
                            list.map((x) => (x.id === d.id ? { ...x, imei: e.target.value } : x))
                          )
                        }
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]/80 placeholder:text-[var(--text-primary)]/40 focus:outline-none focus:border-purple-400/35"
                        placeholder="Enter IMEI/serial"
                      />
                    </label>
                    <label className="text-xs text-[var(--text-primary)]/60 space-y-1">
                      <span className="block">Passcode</span>
                      <input
                        value={d.passcode}
                        onChange={(e) =>
                          setSelectedDevices((list) =>
                            list.map((x) => (x.id === d.id ? { ...x, passcode: e.target.value } : x))
                          )
                        }
                        className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]/80 placeholder:text-[var(--text-primary)]/40 focus:outline-none focus:border-purple-400/35"
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
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Item
              </button>
            }
          >
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)]/80 placeholder:text-[var(--text-primary)]/40 focus:outline-none focus:border-purple-400/35"
                placeholder="Search for item…"
              />
            </div>

            <div className="mt-3 space-y-2">
              {lineItems.map((i) => (
                <div
                  key={i.sku}
                  className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{i.name}</p>
                    <p className="text-xs text-[var(--text-primary)]/55 truncate">
                      {i.cat} • {i.sku}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-primary)]/65">
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-[var(--border-default)]">Qty {i.qty}</span>
                    <span className="tabular-nums">{fmtMoney(i.qty * i.price)}</span>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <button className="hover:text-[var(--text-secondary)]">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="hover:text-red-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-[var(--text-primary)]/80">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/60">Subtotal</span>
                    <span className="tabular-nums">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/60">Tax</span>
                    <span className="tabular-nums">{fmtMoney(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/60">Discount</span>
                    <span className="tabular-nums">{fmtMoney(discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/60">Tips</span>
                    <span className="tabular-nums">{fmtMoney(tips)}</span>
                  </div>
                  <div className="col-span-2 flex justify-between pt-2 border-t border-[var(--border-default)] font-semibold text-[var(--text-primary)]">
                    <span>Total Due</span>
                    <span className="tabular-nums">{fmtMoney(totalDue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            title="Notes"
            subtitle="Latest note stays visible; history on demand."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add
              </button>
            }
          >
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
              <div className="flex items-start gap-2">
                <MessageSquareText className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-primary)]/80">
                    “Customer approved {fmtMoney(subtotal + tax)}. Wants rush if possible.”
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Dec 27, 2025 • 12:06 PM</p>
                </div>
              </div>
              <button className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] inline-flex items-center gap-1">
                <ChevronDown className="w-3.5 h-3.5" />
                View full history
              </button>
            </div>
          </Section>

          <Section
            title="Appointment"
            subtitle="Optional — only if scheduled."
            right={
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm inline-flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Set
              </button>
            }
          >
            <p className="text-sm text-[var(--text-primary)]/60">No appointment set.</p>
          </Section>

          <section className="rounded-2xl border border-[var(--border-default)] bg-white/[0.03]">
            <details className="p-4 border-b border-[var(--border-default)]">
              <summary className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer">Devices & Storage</summary>
              <p className="text-sm text-[var(--text-primary)]/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
            <details className="p-4 border-b border-[var(--border-default)]">
              <summary className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer">Estimates</summary>
              <p className="text-sm text-[var(--text-primary)]/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
            <details className="p-4">
              <summary className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer">Shipping & Tracking</summary>
              <p className="text-sm text-[var(--text-primary)]/60 mt-2">Collapsed by default (UI-only).</p>
            </details>
          </section>
        </div>

        {/* Payment rail */}
        <div className="space-y-4">
          <Section title="Payment" subtitle="POS-first — amount due is front and center." className="bg-white/[0.08]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-[var(--text-primary)]/55 uppercase tracking-[0.08em]">Total Due</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)]">{fmtMoney(totalDue)}</div>
                </div>
                <Pill tone={totalDue > 0 ? 'warn' : 'good'}>
                  {totalDue > 0 ? 'UNPAID' : 'PAID'}
                </Pill>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['cash', 'card', 'other', 'acima'] as PayMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-left text-sm transition',
                      method === m
                        ? 'border-purple-400/40 bg-purple-500/15 text-[var(--text-primary)]'
                        : 'border-[var(--border-default)] bg-white/[0.03] text-[var(--text-primary)]/75 hover:border-white/20'
                    )}
                  >
                    <div className="font-semibold capitalize">{m === 'acima' ? 'Financing' : m}</div>
                    <div className="text-xs text-[var(--text-primary)]/45 mt-1">Tap to set method</div>
                  </button>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
                <DataRow label="Subtotal" value={fmtMoney(subtotal)} />
                <DataRow label="Tax" value={fmtMoney(tax)} />
                <DataRow label="Discount" value={fmtMoney(discount)} />
                <DataRow label="Tips" value={fmtMoney(tips)} />
                <div className="pt-2 border-t border-[var(--border-default)]">
                  <DataRow label="Total Due" value={fmtMoney(totalDue)} strong />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPayDrawerOpen(true)}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition',
                    canTakePayment
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-[var(--text-primary)] shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/40 cursor-not-allowed'
                  )}
                  disabled={!canTakePayment}
                  title={!canTakePayment ? 'Tech role is read-only for payments (UI rule).' : undefined}
                >
                  <CreditCard className="w-4 h-4" />
                  Take Payment
                </button>
                <button className="px-3 py-3 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition text-sm">
                  Print
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
                <div className="text-xs text-[var(--text-muted)] mb-2 uppercase tracking-[0.08em]">Payment history (UI)</div>
                <div className="text-sm text-[var(--text-primary)]/65">No payments yet.</div>
              </div>
            </div>
          </Section>

          <div className="rounded-2xl border border-[var(--border-default)] bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Actions</p>
              <Pill tone={canTakePayment ? 'neutral' : 'warn'}>{canTakePayment ? 'Front Desk/Owner' : 'Tech view'}</Pill>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm">
                Save
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm">
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
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-[var(--border-default)] bg-[#0b0a12]/95 backdrop-blur-xl p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Payment</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {ticket.ticketNumber} • Due {fmtMoney(totalDue)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">UI-only drawer. Functionality later.</p>
              </div>
              <button
                onClick={() => setPayDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-purple-400/30"
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

              <div className="rounded-2xl border border-[var(--border-default)] bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Amount</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Default should suggest “Total Due”, but keep editable.
                </p>

                <div className="mt-3 flex gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(totalDue.toFixed(2))}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]/80 placeholder:text-[var(--text-primary)]/40 focus:outline-none focus:border-purple-400/35"
                    disabled={!canTakePayment}
                  />
                  <button
                    className={[
                      'px-3 py-2 rounded-xl text-sm font-semibold border transition',
                      canTakePayment
                        ? 'bg-purple-500/70 border-purple-400/30 text-[var(--text-primary)] hover:bg-purple-500/80'
                        : 'bg-white/5 border-[var(--border-default)] text-[var(--text-primary)]/40 cursor-not-allowed',
                    ].join(' ')}
                    disabled={!canTakePayment}
                  >
                    Submit
                  </button>
                </div>

                <div className="mt-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] p-3 text-sm text-[var(--text-secondary)]">
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

              <div className="rounded-2xl border border-[var(--border-default)] bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Summary</p>
                <div className="mt-2 space-y-1 text-sm text-[var(--text-primary)]/75">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/55">Subtotal</span>
                    <span className="tabular-nums">{fmtMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/55">Tax</span>
                    <span className="tabular-nums">{fmtMoney(tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-primary)]/55">Discount</span>
                    <span className="tabular-nums">{fmtMoney(discount)}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-default)] flex justify-between font-semibold text-[var(--text-primary)]">
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

      {/* Sticky footer actions */}
      <div className="fixed bottom-4 left-0 right-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-[var(--border-default)] bg-black/65 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="text-xs text-[var(--text-primary)]/55">POS workspace — UI-only</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm">
                Save
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm">
                Print
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)]/75 hover:border-purple-400/30 transition text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { mockCustomers } from '@/lib/mock/data'
import type { Customer } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Drawer } from '@/components/dashboard/ui/drawer'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Phone, Plus, Search, Users, MessageSquare, Smartphone, Ticket as TicketIcon, ShieldAlert, Clock, PhoneCall, History } from 'lucide-react'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { ContextChip } from '@/components/dashboard/ui/context-chip'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function CustomersClient() {
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [profileTab, setProfileTab] = useState('overview')
  const [mainTab, setMainTab] = useState<'list' | 'history'>('list')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return mockCustomers
    const q = query.toLowerCase()
    return mockCustomers.filter((c) => `${c.name} ${c.phone} ${c.email || ''}`.toLowerCase().includes(q))
  }, [query])

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Fast profiles for front desk: contact, history, notes, and quick actions — designed for speed."
        action={
          <Link href="/customers/new">
            <Button leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />} rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}>
              Add Customer
            </Button>
          </Link>
        }
      />

      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as any)}
        tabs={[
          { value: 'list', label: 'Customer List' },
          { value: 'history', label: 'Customer History' },
        ]}
        className="mb-4"
      />

      {mainTab === 'history' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Customer selector */}
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-sm font-semibold text-white/90 mb-4">Select customer</div>
            <div className="space-y-2">
              {mockCustomers.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="text-sm font-semibold text-white/90">{c.name}</div>
                  <div className="text-xs text-white/50 mt-1">{c.phone}</div>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* History timeline */}
          {selected ? (
            <GlassCard className="p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                  {selected.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{selected.name}</div>
                  <div className="text-xs text-white/50">VIP Customer</div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <ContextChip type="preference" value="Prefers text messages" />
                <ContextChip type="repeat-issue" value="3 repairs in 6 months" />
                <ContextChip type="warranty" value="Warranty active until Dec 2024" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-white/50" />
                <div className="text-sm font-semibold text-white/90">Repair history</div>
              </div>
              <div className="space-y-3">
                {[
                  { date: '2 weeks ago', device: 'iPhone 14 Pro screen', amount: 219 },
                  { date: '1 month ago', device: 'iPad Air charge port', amount: 169 },
                  { date: '2 months ago', device: 'Galaxy S22 battery', amount: 129 },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-white/50">{item.date}</div>
                    </div>
                    <div className="text-sm font-semibold text-white/90">{item.device}</div>
                    <div className="text-xs text-white/50 mt-1">${item.amount}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 rounded-3xl text-center">
              <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <div className="text-sm font-semibold text-white/70 mb-2">Select a customer</div>
              <div className="text-xs text-white/50">Choose a customer to view their repair history</div>
            </GlassCard>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-[420px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-11 bg-white/[0.04] border-white/10 w-full"
            placeholder="Search name, phone, email…"
          />
        </div>
        <button className="btn-secondary px-4 py-3 rounded-xl">Tags</button>
        <button className="btn-secondary px-4 py-3 rounded-xl">Sort</button>
      </div>

      {loading ? (
        <GlassCard className="p-6 rounded-3xl">
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
            <Skeleton className="h-10 rounded-2xl" />
          </div>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<Users className="w-8 h-8" aria-hidden="true" />}
            title="No customers found"
            description="Try a different search, or add your first customer to start tracking repairs."
            cta={
              <Link href="/customers/new" className="btn-primary px-5 py-3 rounded-xl inline-flex items-center gap-2">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Customer
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden rounded-3xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold text-white/85">{filtered.length} customers</div>
            <div className="text-xs text-white/45">Click a row to open profile</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/45 border-b border-white/10">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Open tickets</th>
                  <th className="px-5 py-3">Last visit</th>
                  <th className="px-5 py-3">Lifetime value</th>
                  <th className="px-5 py-3">Quick</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/10 hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white/90">{c.name}</div>
                      <div className="text-xs text-white/45">{(c.tags || []).join(' • ') || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/75">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-white/45" aria-hidden="true" />
                        {c.phone}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-white/45" aria-hidden="true" />
                        {c.email || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-white/85">{c.openTickets}</td>
                    <td className="px-5 py-4 text-sm text-white/75">{new Date(c.lastVisit).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-white/85">{fmtMoney(c.lifetimeValue)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-secondary px-3 py-2 rounded-xl text-xs">Message</button>
                        <Link href="/tickets/new" className="btn-primary px-3 py-2 rounded-xl text-xs">
                          New ticket
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
        </div>
      )}

      <Drawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null)
            setProfileTab('overview')
          }
        }}
        title={selected ? selected.name : 'Customer'}
        description={selected ? `Profile • ${selected.phone} • ${selected.email || 'no email'}` : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            {/* Call / Text button group */}
            <div className="flex items-center gap-2">
              <button className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 flex-1">
                <PhoneCall className="w-4 h-4" />
                Call
              </button>
              <button className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 flex-1">
                <MessageSquare className="w-4 h-4" />
                Text
              </button>
            </div>

            <Tabs
              value={profileTab}
              onValueChange={setProfileTab}
              tabs={[
                { value: 'overview', label: 'Overview' },
                { value: 'devices', label: 'Devices' },
                { value: 'tickets', label: 'Tickets' },
                { value: 'risk', label: 'Risk' },
                { value: 'communication', label: 'Messages' },
              ]}
            />

            {profileTab === 'overview' ? (
              <>
                <div className="grid gap-3">
                  {[
                    { k: 'Open tickets', v: String(selected.openTickets) },
                    { k: 'Lifetime value', v: fmtMoney(selected.lifetimeValue) },
                    { k: 'Last visit', v: new Date(selected.lastVisit).toLocaleString() },
                    { k: 'Tags', v: (selected.tags || []).join(', ') || '—' },
                  ].map((row) => (
                    <div key={row.k} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                      <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">{row.k}</div>
                      <div className="text-sm text-white/85 mt-1 font-semibold">{row.v}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-5">
                  <div className="text-sm font-semibold text-white/90 mb-3">Quick actions</div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/tickets/new" className="btn-secondary px-4 py-2.5 rounded-xl text-sm">
                      Create ticket
                    </Link>
                    <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm">Add note</button>
                    <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm">Edit profile</button>
                  </div>
                </div>
              </>
            ) : profileTab === 'devices' ? (
              <div className="space-y-3">
                {[
                  { device: 'iPhone 14 Pro', imei: '356938035643809', lastRepair: 'Today' },
                  { device: 'iPad Air', imei: '—', lastRepair: '2 weeks ago' },
                ].map((d) => (
                  <div key={d.device} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-purple-300" />
                      <div className="text-sm font-semibold text-white/90">{d.device}</div>
                    </div>
                    <div className="text-xs text-white/55">IMEI: {d.imei}</div>
                    <div className="text-xs text-white/55 mt-1">Last repair: {d.lastRepair}</div>
                  </div>
                ))}
                <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm w-full">Add device</button>
              </div>
            ) : profileTab === 'tickets' ? (
              <div className="space-y-2">
                {[
                  { id: 'FIX-1041', device: 'iPhone 14 Pro screen', price: 219, status: 'In Repair' },
                  { id: 'FIX-1028', device: 'iPad Air charge port', price: 169, status: 'Ready' },
                  { id: 'FIX-1007', device: 'Galaxy S22 battery', price: 129, status: 'Picked Up' },
                ].map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="block rounded-2xl bg-white/[0.03] border border-white/10 p-4 hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white/90">{t.id}</div>
                        <div className="text-xs text-white/55">{t.device}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white/85">{fmtMoney(t.price)}</div>
                        <div className="text-xs text-white/45">{t.status}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : profileTab === 'risk' ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-300" />
                    <div className="text-sm font-semibold text-white/90">Reputation score</div>
                  </div>
                  <div className="text-lg font-bold text-white">4.8 / 5.0</div>
                  <div className="text-xs text-white/55 mt-1">Based on {selected.openTickets} repairs</div>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white/90 mb-2">Flags</div>
                  <div className="text-xs text-white/55">No flags (UI only)</div>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white/90 mb-2">Repeat customer</div>
                  <div className="text-xs text-white/55">Yes — {selected.openTickets} previous repairs</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { who: 'Fixology', when: 'Today, 10:14 AM', msg: 'We received your device and started diagnostics.' },
                  { who: selected.name, when: 'Today, 10:22 AM', msg: 'Thanks — please confirm the estimate when ready.' },
                  { who: 'Fixology', when: '2 days ago', msg: 'Your repair is ready for pickup!' },
                ].map((m) => (
                  <div key={m.when} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-white/85">{m.who}</div>
                      <div className="text-xs text-white/45">{m.when}</div>
                    </div>
                    <div className="text-sm text-white/70">{m.msg}</div>
                  </div>
                ))}
                <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm w-full">Send message</button>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}



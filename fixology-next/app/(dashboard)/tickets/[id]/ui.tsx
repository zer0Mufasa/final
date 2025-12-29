'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { mockTickets } from '@/lib/mock/data'
import type { Ticket } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { StatusBadge, RiskBadge } from '@/components/dashboard/ui/badge'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Button } from '@/components/ui/button'
import { Camera, ClipboardList, MessageSquare, Package, ShieldAlert, Wrench, FileText, Clock, DollarSign, ArrowRight, Plus, Printer } from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TicketDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [])

  const ticket: Ticket | null = useMemo(() => mockTickets.find((t) => t.id === id) || null, [id])

  if (!ticket) {
    return (
      <GlassCard className="rounded-3xl">
        <EmptyState
          icon={<ClipboardList className="w-8 h-8" aria-hidden="true" />}
          title="Ticket not found"
          description="This is a UI-only demo dataset. Try opening a ticket from the board or list."
          cta={<Link href="/tickets" className="btn-primary px-5 py-3 rounded-xl">Back to tickets</Link>}
        />
      </GlassCard>
    )
  }

  return (
    <div>
      <PageHeader
        title={`${ticket.ticketNumber} • ${ticket.customerName}`}
        description={`${ticket.device} • Promised ${new Date(ticket.promisedAt).toLocaleString()} • Assigned ${ticket.assignedTo || '—'}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/tickets" className="btn-secondary px-4 py-3 rounded-xl">Tickets</Link>
            <Button leftIcon={<MessageSquare className="w-4 h-4" aria-hidden="true" />} variant="secondary">
              Send update (UI)
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <StatusBadge status={ticket.status} />
        {ticket.risk !== 'none' && <RiskBadge risk={ticket.risk} />}
        <span className="badge bg-white/5 text-white/55 border border-white/10">
          Est. {fmtMoney(ticket.price)}
        </span>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'device', label: 'Device' },
          { value: 'diagnostics', label: 'Diagnostics' },
          { value: 'parts', label: 'Parts' },
          { value: 'updates', label: 'Updates' },
          { value: 'photos', label: 'Photos' },
          { value: 'pricing', label: 'Pricing' },
          { value: 'timeline', label: 'Timeline' },
        ]}
        className="mb-4"
      />

      {/* Sticky action bar */}
      <div className="sticky top-[73px] z-20 mb-4 -mx-4 px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Next stage
            </button>
            <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Add update
            </button>
            <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add part
            </button>
            <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Create invoice
            </button>
            <button className="btn-secondary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print intake
            </button>
          </div>
          <div className="text-xs text-white/40">UI only — actions will route</div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[220px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[220px] rounded-3xl" />
          <Skeleton className="h-[260px] rounded-3xl lg:col-span-3" />
        </div>
      ) : tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Wrench className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Summary
            </div>
            <div className="mt-3 text-sm text-white/70 leading-relaxed">
              Customer reports intermittent touch and a spreading black spot after a drop. Device powers on. No passcode provided yet.
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { k: 'Priority', v: 'Normal' },
                { k: 'Promised', v: new Date(ticket.promisedAt).toLocaleString() },
                { k: 'Assigned tech', v: ticket.assignedTo || 'Unassigned' },
                { k: 'Intake channel', v: 'Walk-in (UI)' },
              ].map((row) => (
                <div key={row.k} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">{row.k}</div>
                  <div className="text-sm text-white/85 mt-1 font-semibold">{row.v}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="rounded-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <ShieldAlert className="w-4 h-4 text-yellow-300" aria-hidden="true" />
              Risk signals (UI)
            </div>
            <div className="mt-3 space-y-2">
              {[
                { title: 'Possible OLED damage', desc: 'Black spot noted; could expand during repair.' },
                { title: 'Water indicator', desc: 'No visible signs, but verify at teardown.' },
                { title: 'Data backup', desc: 'Confirm backups before invasive work.' },
              ].map((r) => (
                <div key={r.title} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-white/85">{r.title}</div>
                  <div className="text-xs text-white/55 mt-1 leading-relaxed">{r.desc}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="rounded-3xl lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <ClipboardList className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Next actions
              </div>
              <div className="text-xs text-white/45">UI only — no persistence yet</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { title: 'Confirm passcode', desc: 'Ask customer at drop-off if needed for testing.' },
                { title: 'Run display diagnostics', desc: 'Check touch grid + True Tone readiness.' },
                { title: 'Quote approval', desc: 'Send estimate + promised time update.' },
              ].map((a) => (
                <div key={a.title} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-white/85">{a.title}</div>
                  <div className="text-xs text-white/55 mt-1 leading-relaxed">{a.desc}</div>
                  <button className="btn-secondary px-3 py-2 rounded-xl text-xs mt-3">Mark done</button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : tab === 'device' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <FileText className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Device details
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { k: 'Device', v: ticket.device },
                { k: 'Color', v: 'Deep Purple (UI)' },
                { k: 'IMEI', v: '356938035643809 (UI)' },
                { k: 'Serial', v: 'F2LXN0C9Q1 (UI)' },
                { k: 'Passcode', v: 'Not provided' },
                { k: 'Backup', v: 'Discussed' },
              ].map((row) => (
                <div key={row.k} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">{row.k}</div>
                  <div className="text-sm text-white/85 mt-1 font-semibold">{row.v}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Device checklist</div>
            <div className="mt-4 space-y-2">
              {['Powers on', 'Touch grid', 'Charge port', 'Face ID / Touch ID', 'Camera', 'Speakers'].map((x, i) => (
                <label key={x} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer">
                  <span className="text-sm text-white/80">{x}</span>
                  <input type="checkbox" defaultChecked={i < 2} className="accent-[#a78bfa]" />
                </label>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : tab === 'diagnostics' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Wrench className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Diagnostic findings (mock)
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { k: 'Primary cause', v: 'Impact damage to display assembly' },
                { k: 'Confidence', v: '0.82 (UI)' },
                { k: 'Warnings', v: 'Possible OLED bleed expansion' },
                { k: 'Next steps', v: 'Replace display, verify True Tone, run touch grid test' },
              ].map((row) => (
                <div key={row.k} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-white/45 font-semibold">{row.k}</div>
                  <div className="text-sm text-white/85 mt-1 font-semibold">{row.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <div className="text-sm font-semibold text-white/85">Repair guidance checklist</div>
              <div className="mt-3 space-y-2">
                {['Inspect frame for bends', 'Transfer proximity sensor safely', 'Replace gasket/adhesive', 'Verify True Tone calibration', 'Run final QA (touch, camera, speaker)'].map((x, i) => (
                  <label key={x} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-white/[0.04]">
                    <span className="text-sm text-white/75">{x}</span>
                    <input type="checkbox" defaultChecked={i === 0} className="accent-[#a78bfa]" />
                  </label>
                ))}
              </div>
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Run diagnostic (UI)</div>
            <div className="mt-3 text-xs text-white/55 leading-relaxed">
              This panel will later call the diagnostics engine. For now it’s a polished placeholder.
            </div>
            <button className="btn-primary px-4 py-3 rounded-xl w-full mt-4">Run diagnostic</button>
            <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-2">Add note</button>
          </GlassCard>
        </div>
      ) : tab === 'parts' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2 p-0 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Package className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Parts list
              </div>
              <button className="btn-primary px-4 py-2 rounded-xl text-sm">Add part</button>
            </div>
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-white/45 border-b border-white/10">
                    <th className="py-3 text-left">Part</th>
                    <th className="py-3 text-left">Qty</th>
                    <th className="py-3 text-left">Status</th>
                    <th className="py-3 text-left">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: 'iPhone 14 Pro Screen (OEM)', q: 1, s: 'Allocated (UI)', c: 124 },
                    { p: 'Adhesive kit', q: 1, s: 'Ready (UI)', c: 2 },
                  ].map((r) => (
                    <tr key={r.p} className="border-b border-white/10">
                      <td className="py-3 text-sm text-white/85 font-semibold">{r.p}</td>
                      <td className="py-3 text-sm text-white/70">{r.q}</td>
                      <td className="py-3 text-sm text-white/70">{r.s}</td>
                      <td className="py-3 text-sm text-white/80 font-semibold">{fmtMoney(r.c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Reorder hint (UI)</div>
            <div className="mt-3 text-xs text-white/55 leading-relaxed">
              Stock is low for “iPhone 14 Pro Screen (OEM)”. Suggested reorder: 6 units.
            </div>
            <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-4">Create reorder draft</button>
          </GlassCard>
        </div>
      ) : tab === 'updates' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <MessageSquare className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Customer updates
            </div>
            <div className="mt-4 space-y-3">
              {[
                { who: 'Fixology', when: 'Today, 10:14 AM', msg: 'We received your device and started diagnostics. Next update soon.' },
                { who: ticket.customerName, when: 'Today, 10:22 AM', msg: 'Thanks — please confirm the estimate when ready.' },
              ].map((m) => (
                <div key={m.when} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white/85">{m.who}</div>
                    <div className="text-xs text-white/45">{m.when}</div>
                  </div>
                  <div className="mt-2 text-sm text-white/75 leading-relaxed">{m.msg}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Send update (UI)</div>
            <textarea className="w-full mt-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[160px]" placeholder="Short, calm update for the customer…" />
            <button className="btn-primary px-4 py-3 rounded-xl w-full mt-3">Send</button>
          </GlassCard>
        </div>
      ) : tab === 'photos' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Camera className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Photos
            </div>
            <div className="mt-4">
              <EmptyState
                icon={<Camera className="w-8 h-8" aria-hidden="true" />}
                title="No photos yet"
                description="Add intake photos and repair progress shots for clean documentation."
                cta={<button className="btn-primary px-5 py-3 rounded-xl">Upload photos (UI)</button>}
              />
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Photo checklist</div>
            <div className="mt-4 space-y-2">
              {['Front glass', 'Back glass', 'Damage close-up', 'Liquid indicator', 'Post-repair result'].map((x, i) => (
                <label key={x} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <span className="text-sm text-white/80">{x}</span>
                  <input type="checkbox" defaultChecked={i === 0} className="accent-[#a78bfa]" />
                </label>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : tab === 'pricing' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2 p-0 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <DollarSign className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Estimate
              </div>
              <button className="btn-primary px-4 py-2 rounded-xl text-sm">Build invoice (UI)</button>
            </div>
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-white/45 border-b border-white/10">
                    <th className="py-3 text-left">Line item</th>
                    <th className="py-3 text-left">Qty</th>
                    <th className="py-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: 'Screen replacement', q: 1, p: 219 },
                    { n: 'Adhesive kit', q: 1, p: 9 },
                    { n: 'Labor', q: 1, p: 0 },
                  ].map((r) => (
                    <tr key={r.n} className="border-b border-white/10">
                      <td className="py-3 text-sm text-white/85 font-semibold">{r.n}</td>
                      <td className="py-3 text-sm text-white/70">{r.q}</td>
                      <td className="py-3 text-sm text-white/80 font-semibold">{fmtMoney(r.p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-end gap-6">
                <div className="text-sm text-white/55">Subtotal</div>
                <div className="text-sm font-bold text-white/85">{fmtMoney(228)}</div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-6">
                <div className="text-sm text-white/55">Tax (est.)</div>
                <div className="text-sm font-bold text-white/85">{fmtMoney(18)}</div>
              </div>
              <div className="mt-2 flex items-center justify-end gap-6">
                <div className="text-sm text-white/55">Total</div>
                <div className="text-lg font-extrabold text-white">{fmtMoney(246)}</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Approval (UI)</div>
            <div className="mt-3 text-xs text-white/55 leading-relaxed">
              When wired, this will send an estimate and capture approval. For now it’s a polished placeholder.
            </div>
            <button className="btn-primary px-4 py-3 rounded-xl w-full mt-4">Send estimate</button>
            <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-2">Mark approved</button>
          </GlassCard>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="rounded-3xl lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <Clock className="w-4 h-4 text-purple-300" aria-hidden="true" />
              Timeline
            </div>
            <div className="mt-4 space-y-3">
              {[
                { t: 'Ticket created', d: 'Today, 9:42 AM', m: 'Intake started by front desk.' },
                { t: 'Diagnostics started', d: 'Today, 10:01 AM', m: 'Initial checks completed.' },
                { t: 'Estimate drafted', d: 'Today, 10:18 AM', m: 'Awaiting customer approval.' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white/85">{x.t}</div>
                    <div className="text-xs text-white/45">{x.d}</div>
                  </div>
                  <div className="mt-2 text-sm text-white/70">{x.m}</div>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="rounded-3xl">
            <div className="text-sm font-semibold text-white/90">Add event (UI)</div>
            <textarea className="w-full mt-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[150px]" placeholder="What changed? Short internal note…" />
            <button className="btn-primary px-4 py-3 rounded-xl w-full mt-3">Add</button>
          </GlassCard>
        </div>
      )}
    </div>
  )
}



'use client'

import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { FileText, Filter, Search, Calendar, User, CreditCard } from 'lucide-react'

const paymentSummary = [
  { label: 'Collected today', value: '$4,280', sub: '+$320 vs yesterday' },
  { label: 'This week', value: '$19,420', sub: '+4.2% vs last week' },
  { label: 'Outstanding', value: '$1,120', sub: 'Invoices awaiting payment' },
  { label: 'Avg ticket', value: '$182', sub: 'Past 30 days' },
]

const payments = [
  { date: 'Today', ticket: 'TCK-2408', customer: 'Jordan Lee', method: 'Card', amount: '$420', status: 'Paid', staff: 'Ava' },
  { date: 'Today', ticket: 'TCK-2407', customer: 'Priya Patel', method: 'Cash', amount: '$190', status: 'Paid', staff: 'Noah' },
  { date: 'Yesterday', ticket: 'TCK-2406', customer: 'Sam Chen', method: 'Cash App', amount: '$310', status: 'Paid', staff: 'Sofia' },
  { date: '2d ago', ticket: 'TCK-2405', customer: 'Alina Flores', method: 'Card', amount: '$620', status: 'Pending', staff: 'Ava' },
]

export function PaymentsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="UI-only: payment list, filters, and summaries. Use the checkout drawer from tickets to collect."
        action={<button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Record payment</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paymentSummary.map((s) => (
          <GlassCard key={s.label} className="p-4 rounded-2xl border border-white/10">
            <p className="text-xs uppercase text-white/50">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-xs text-emerald-300/80 mt-1">{s.sub}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white/80 placeholder:text-white/40" placeholder="Search ticket or customer…" />
          </div>
          <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</button>
          <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Method</button>
          <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Status</button>
          <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm flex items-center gap-2"><User className="w-4 h-4" /> Staff</button>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" aria-hidden="true" />}
            title="No payments yet"
            description="Collect from a ticket to see the history here."
            cta={<button className="btn-primary px-5 py-3 rounded-xl">Take payment</button>}
          />
        ) : (
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-7 text-xs uppercase tracking-wide text-white/40 pb-2">
              <span>Date</span>
              <span>Ticket</span>
              <span>Customer</span>
              <span>Method</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">Staff</span>
            </div>
            {payments.map((p) => (
              <div key={p.ticket} className="py-3 grid grid-cols-7 items-center text-sm text-white/80">
                <span>{p.date}</span>
                <span>{p.ticket}</span>
                <span>{p.customer}</span>
                <span>{p.method}</span>
                <span className="font-semibold">{p.amount}</span>
                <span>
                  <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-200 border border-emerald-500/20">
                    {p.status}
                  </span>
                </span>
                <span className="text-right text-white/60">{p.staff}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}


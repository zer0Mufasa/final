'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Phone, Plus, User } from 'lucide-react'

export function NewCustomerClient() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <PageHeader
        title="Add Customer"
        description="Create a clean customer profile for fast tickets, updates, and receipts."
        action={
          <div className="flex items-center gap-2">
            <Link href="/customers" className="btn-secondary px-4 py-3 rounded-xl">
              Back
            </Link>
            <Button leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />} rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}>
              Save customer (UI)
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <GlassCard className="rounded-3xl">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-10 rounded-2xl" />
              <Skeleton className="h-[160px] rounded-2xl" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Full name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                  <input className="input pl-11 bg-white/[0.04] border-white/10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" />
                </div>
              </div>
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                  <input className="input pl-11 bg-white/[0.04] border-white/10" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                  <input className="input pl-11 bg-white/[0.04] border-white/10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <textarea className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[160px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferences, VIP flags, warranty notes, etc." />
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="rounded-3xl">
          <div className="text-sm font-semibold text-white/90">What gets better</div>
          <div className="mt-2 text-sm text-white/55 leading-relaxed">
            Adding a customer now makes intake faster later: one-click tickets, clean updates, and receipts with correct contact info.
          </div>

          <div className="mt-4 space-y-2">
            {[
              'Auto-fill contact on new tickets',
              'Track open repairs + history',
              'Send polished SMS/email updates (later)',
            ].map((x) => (
              <div key={x} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white/75">
                {x}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}



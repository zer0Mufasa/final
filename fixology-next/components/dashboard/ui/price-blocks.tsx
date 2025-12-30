'use client'

import { Info, ShieldCheck, ArrowRightLeft, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type PriceLine = {
  label: string
  amount: string
  hint: string
}

export function PriceBreakdown({
  lines,
  total,
  confidence = 'Common price',
}: {
  lines: PriceLine[]
  total: string
  confidence?: 'Common price' | 'Higher than usual' | 'Lower than average'
}) {
  const tone =
    confidence === 'Higher than usual'
      ? 'bg-amber-500/10 text-amber-200 border-amber-500/30'
      : confidence === 'Lower than average'
        ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
        : 'bg-blue-500/10 text-blue-200 border-blue-500/30'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border', tone)}>
        <Sparkles className="w-3.5 h-3.5" />
        {confidence}
      </div>
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.label} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 text-white/80 text-sm">
              <Info className="w-4 h-4 text-white/50 mt-0.5" />
              <div>
                <p className="font-semibold text-white">{line.label}</p>
                <p className="text-white/60 text-xs">{line.hint}</p>
              </div>
            </div>
            <p className="text-white font-semibold">{line.amount}</p>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
        <p className="text-white/70 font-semibold text-sm">Total</p>
        <p className="text-xl font-bold text-white">{total}</p>
      </div>
    </div>
  )
}

export function ApprovalCard({
  deviceImage,
  problem,
  scope,
  exclusions,
  price,
  eta,
  warranty,
}: {
  deviceImage: string
  problem: string
  scope: string
  exclusions: string
  price: string
  eta: string
  warranty: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4 max-w-xl">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
          <img src={deviceImage} alt="Device" className="object-contain w-full h-full" />
        </div>
        <div>
          <p className="text-white font-semibold">Repair approval</p>
          <p className="text-white/60 text-sm">{problem}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-white/70">
        <p><span className="text-white font-semibold">We will fix:</span> {scope}</p>
        <p><span className="text-white font-semibold">Won’t fix:</span> {exclusions}</p>
        <p><span className="text-white font-semibold">Warranty:</span> {warranty}</p>
        <p><span className="text-white font-semibold">Turnaround:</span> {eta}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Final price</p>
          <p className="text-2xl font-bold text-white">{price}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl bg-green-500 text-white font-semibold shadow-lg shadow-green-500/30">Approve Repair</button>
          <button className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:border-white/40 transition">Decline / Ask</button>
        </div>
      </div>
    </div>
  )
}

export function WhyPriceAccordion() {
  const rows = [
    { title: 'Parts market cost', desc: 'Sourced at today’s rates with quality grading (A/B stock).' },
    { title: 'Labor skill level', desc: 'Trained technician time based on repair complexity.' },
    { title: 'Time required', desc: 'Includes disassembly, replacement, testing, and QA.' },
    { title: 'Warranty coverage', desc: 'Post-repair warranty included; we cover the part and labor for defects.' },
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      {rows.map((row) => (
        <details key={row.title} className="group border border-white/5 rounded-xl px-3 py-2">
          <summary className="flex items-center justify-between cursor-pointer text-white font-semibold text-sm">
            {row.title}
            <span className="text-white/50 group-open:rotate-90 transition">›</span>
          </summary>
          <p className="text-white/60 text-sm mt-2">{row.desc}</p>
        </details>
      ))}
    </div>
  )
}

export function UpsellList() {
  const items = [
    'Screen protector (recommended while device is already open)',
    'Battery health check',
    'Cleaning (ports and vents)',
    'Data backup / safety check',
  ]
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      <p className="text-white/70 text-sm font-semibold">Protective recommendations</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-white/70 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PriceChangeNotice() {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-100">
        <AlertTriangle className="w-4 h-4" />
        <p className="font-semibold text-sm">New issue found — price update requires approval</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-white/80">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/60 text-xs">Original scope</p>
          <p className="text-white font-semibold">Screen replacement — $220</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/60 text-xs">New scope</p>
          <p className="text-white font-semibold">+ Frame repair — $60</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30">Approve update</button>
        <button className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:border-white/40 transition">Decline / Ask</button>
      </div>
    </div>
  )
}

export function WarrantyCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      <div className="flex items-center gap-2 text-white">
        <ShieldCheck className="w-5 h-5 text-emerald-300" />
        <p className="font-semibold">Warranty Coverage</p>
      </div>
      <p className="text-sm text-white/70">180 days • Parts & labor for workmanship defects.</p>
      <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/50">What’s covered</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Defective replacement part</li>
            <li>Workmanship issues</li>
            <li>Post-repair testing</li>
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/50">What voids it</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Physical damage</li>
            <li>Liquid exposure</li>
            <li>Unauthorised tampering</li>
          </ul>
        </div>
      </div>
      <p className="text-xs text-white/50">Starts: Today • Keep receipt for proof of coverage.</p>
    </div>
  )
}

export function TechProtection() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
      <p className="text-sm font-semibold text-white">Tech protection</p>
      <div className="text-sm text-white/70 space-y-1">
        <p>Customer approved: Today, 2:41 PM</p>
        <p>Approved by: SMS link + in-store confirmation</p>
        <p>Notes snapshot: “Agreed to frame crack risk.”</p>
      </div>
    </div>
  )
}


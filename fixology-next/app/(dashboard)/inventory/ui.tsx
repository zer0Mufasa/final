'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { mockInventory } from '@/lib/mock/data'
import type { InventoryItem } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Modal } from '@/components/dashboard/ui/modal'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, Package, Plus, Search, Truck } from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function InventoryClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [openAdd, setOpenAdd] = useState(false)

  // Add part modal can be opened by top bar: /inventory?add=1
  useEffect(() => {
    setOpenAdd(sp.get('add') === '1')
  }, [sp])

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return mockInventory
    const q = query.toLowerCase()
    return mockInventory.filter((i) => `${i.name} ${i.sku} ${i.vendor}`.toLowerCase().includes(q))
  }, [query])

  const lowStock = useMemo(() => filtered.filter((i) => i.onHand <= i.min), [filtered])

  const closeAdd = () => {
    setOpenAdd(false)
    router.replace('/inventory')
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Keep parts predictable: low stock visibility, reorder hints, and clean vendor-ready lists."
        action={
          <Button leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />} rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />} onClick={() => router.push('/inventory?add=1')}>
            Add part
          </Button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-[420px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-11 bg-white/[0.04] border-white/10 w-full"
            placeholder="Search part, SKU, vendor…"
          />
        </div>
        <button className="btn-secondary px-4 py-3 rounded-xl">Vendor</button>
        <button className="btn-secondary px-4 py-3 rounded-xl">Sort</button>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[160px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[160px] rounded-3xl" />
          <Skeleton className="h-[320px] rounded-3xl lg:col-span-3" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="rounded-3xl">
          <EmptyState
            icon={<Package className="w-8 h-8" aria-hidden="true" />}
            title="No inventory items"
            description="Add your first part to start tracking stock and reorder suggestions."
            cta={
              <button className="btn-primary px-5 py-3 rounded-xl inline-flex items-center gap-2" onClick={() => router.push('/inventory?add=1')}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add part
              </button>
            }
          />
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="text-sm font-semibold text-white/90">Low stock</div>
              <div className="text-xs text-white/50 mt-1">Parts at or below minimums.</div>
              <div className="mt-4 space-y-2">
                {lowStock.length ? (
                  lowStock.map((i) => (
                    <div key={i.id} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/85 truncate">{i.name}</div>
                        <div className="text-xs text-white/45 mt-0.5">SKU {i.sku} • Vendor {i.vendor}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge bg-red-500/15 text-red-300 border border-red-400/20">
                          <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />
                          {i.onHand} on hand (min {i.min})
                        </span>
                        <button className="btn-secondary px-3 py-2 rounded-xl text-xs">Reorder</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-4 text-sm text-white/60">
                    Nice — nothing is below minimum right now.
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Reorder suggestions</div>
              <div className="text-xs text-white/50 mt-1">UI-only: vendor-ready draft list.</div>
              <div className="mt-4 space-y-2">
                {(lowStock.length ? lowStock : filtered.slice(0, 2)).map((i) => (
                  <div key={i.id} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                    <div className="text-sm font-semibold text-white/85">{i.name}</div>
                    <div className="text-xs text-white/45 mt-1">
                      Suggested: order <span className="text-white/80 font-semibold">{Math.max(0, i.min * 2 - i.onHand)}</span> • Lead time {i.leadTimeDays}d
                    </div>
                  </div>
                ))}
                <button className="btn-primary px-4 py-3 rounded-xl w-full mt-1 inline-flex items-center justify-center gap-2">
                  <Truck className="w-4 h-4" aria-hidden="true" />
                  Generate PO draft (UI)
                </button>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-0 overflow-hidden rounded-3xl mt-4">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="text-sm font-semibold text-white/85">Parts</div>
              <div className="text-xs text-white/45">{filtered.length} items</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/45 border-b border-white/10">
                    <th className="px-5 py-3">Part</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">On hand</th>
                    <th className="px-5 py-3">Min</th>
                    <th className="px-5 py-3">Unit cost</th>
                    <th className="px-5 py-3">Retail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const isLow = i.onHand <= i.min
                    return (
                      <tr key={i.id} className="border-b border-white/10 hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white/90">{i.name}</div>
                          {isLow ? <div className="text-xs text-red-300 mt-0.5">Low stock</div> : <div className="text-xs text-white/40 mt-0.5">Healthy</div>}
                        </td>
                        <td className="px-5 py-4 text-sm text-white/75">{i.sku}</td>
                        <td className="px-5 py-4 text-sm text-white/75">{i.vendor}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-white/85">{i.onHand}</td>
                        <td className="px-5 py-4 text-sm text-white/75">{i.min}</td>
                        <td className="px-5 py-4 text-sm text-white/75">{fmtMoney(i.unitCost)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-white/85">{fmtMoney(i.retail)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      <Modal open={openAdd} onOpenChange={(o) => (o ? router.push('/inventory?add=1') : closeAdd())} title="Add part" description="UI-only: create a new inventory item (we’ll wire persistence later).">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Part name</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="iPhone 14 Pro Screen (OEM)" />
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="IP14P-SCR-OEM" />
          </div>
          <div>
            <label className="label">Vendor</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="PrimeParts" />
          </div>
          <div>
            <label className="label">On hand</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="0" />
          </div>
          <div>
            <label className="label">Minimum</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="5" />
          </div>
          <div>
            <label className="label">Unit cost</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="$0.00" />
          </div>
          <div>
            <label className="label">Retail price</label>
            <input className="input bg-white/[0.04] border-white/10" placeholder="$0.00" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button className="btn-secondary px-4 py-3 rounded-xl" onClick={closeAdd}>
              Cancel
            </button>
            <button className="btn-primary px-4 py-3 rounded-xl" onClick={closeAdd}>
              Save part (UI)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}



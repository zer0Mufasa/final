'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { InventoryCategory } from '@/lib/mock/types'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { EmptyState } from '@/components/dashboard/ui/empty-state'
import { Modal } from '@/components/dashboard/ui/modal'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'
import {
  AlertTriangle,
  Package,
  Plus,
  Search,
  Truck,
  Monitor,
  Battery,
  Plug,
  Camera,
  Volume2,
  Wrench,
  Layers,
  Box,
  ShoppingBag,
  Filter,
  MapPin,
  Sparkles,
  TrendingUp,
  DollarSign,
} from 'lucide-react'

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const categoryInfo: Record<InventoryCategory, { label: string; icon: typeof Monitor; gradient: [string, string] }> = {
  screens: { label: 'Screens', icon: Monitor, gradient: ['#8b5cf6', '#a855f7'] },
  batteries: { label: 'Batteries', icon: Battery, gradient: ['#10b981', '#059669'] },
  ports: { label: 'Charging Ports', icon: Plug, gradient: ['#f59e0b', '#d97706'] },
  cameras: { label: 'Cameras', icon: Camera, gradient: ['#3b82f6', '#2563eb'] },
  speakers: { label: 'Speakers', icon: Volume2, gradient: ['#ec4899', '#db2777'] },
  housings: { label: 'Housings', icon: Box, gradient: ['#6366f1', '#4f46e5'] },
  adhesives: { label: 'Adhesives', icon: Layers, gradient: ['#14b8a6', '#0d9488'] },
  tools: { label: 'Tools', icon: Wrench, gradient: ['#64748b', '#475569'] },
  accessories: { label: 'Accessories', icon: ShoppingBag, gradient: ['#f43f5e', '#e11d48'] },
  other: { label: 'Other', icon: Package, gradient: ['#78716c', '#57534e'] },
}

type StockFilter = 'all' | 'low' | 'healthy' | 'out'

type InventoryItemUI = {
  id: string
  name: string
  sku: string
  category: InventoryCategory
  vendor: string
  onHand: number
  min: number
  unitCost: number
  retail: number
  location?: string
}

export function InventoryClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [animationReady, setAnimationReady] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<InventoryCategory | 'all'>('all')
  const [vendor, setVendor] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [openAdd, setOpenAdd] = useState(false)
  const [items, setItems] = useState<InventoryItemUI[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category: 'screens' as InventoryCategory,
    sku: '',
    vendor: '',
    location: '',
    onHand: 0,
    min: 0,
    unitCost: '',
    retail: '',
  })

  useEffect(() => {
    setOpenAdd(sp.get('add') === '1')
  }, [sp])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/inventory', { cache: 'no-store' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Failed to load inventory')
        }
        const data = await res.json()
        if (!cancelled) setItems(Array.isArray(data?.items) ? data.items : [])
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || 'Failed to load inventory')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setTimeout(() => setAnimationReady(true), 100)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Get unique vendors
  const vendors = useMemo(() => {
    const v = new Set<string>()
    items.forEach((i) => v.add(i.vendor))
    return Array.from(v).sort()
  }, [items])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    items.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1
    })
    return counts
  }, [items])

  // Filter inventory
  const filtered = useMemo(() => {
    let result = items

    if (category !== 'all') {
      result = result.filter((i) => i.category === category)
    }

    if (vendor !== 'all') {
      result = result.filter((i) => i.vendor === vendor)
    }

    switch (stockFilter) {
      case 'low':
        result = result.filter((i) => i.onHand <= i.min && i.onHand > 0)
        break
      case 'out':
        result = result.filter((i) => i.onHand === 0)
        break
      case 'healthy':
        result = result.filter((i) => i.onHand > i.min)
        break
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((i) =>
        `${i.name} ${i.sku} ${i.vendor} ${i.location || ''}`.toLowerCase().includes(q)
      )
    }

    return result
  }, [items, query, category, vendor, stockFilter])

  const lowStock = useMemo(() => items.filter((i) => i.onHand <= i.min && i.onHand > 0), [items])
  const outOfStock = useMemo(() => items.filter((i) => i.onHand === 0), [items])
  const totalValue = useMemo(() => items.reduce((sum, i) => sum + i.unitCost * i.onHand, 0), [items])

  const closeAdd = () => {
    setOpenAdd(false)
    router.replace('/inventory')
  }

  const handleSave = async () => {
    if (saving) return
    if (!form.name.trim()) return toast.error('Part name is required')
    if (!String(form.retail).trim()) return toast.error('Retail price is required')

    setSaving(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          sku: form.sku,
          vendor: form.vendor,
          location: form.location,
          onHand: Number(form.onHand || 0),
          min: Number(form.min || 0),
          unitCost: String(form.unitCost).trim() === '' ? null : Number(form.unitCost),
          retail: Number(form.retail),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to create part')
      }

      const data = await res.json()
      const newItem = data?.item
      if (newItem) setItems((prev) => [newItem, ...prev])
      toast.success('Part added')
      setForm({
        name: '',
        category: 'screens',
        sku: '',
        vendor: '',
        location: '',
        onHand: 0,
        min: 0,
        unitCost: '',
        retail: '',
      })
      closeAdd()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create part')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-page-in">
      {/* Enhanced Header */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <PageHeader
          title="Inventory"
          description="Track parts, manage stock levels, and generate purchase orders."
          action={
            <button
              onClick={() => router.push('/inventory?add=1')}
              className={cn(
                "group relative px-5 py-3 rounded-xl inline-flex items-center gap-2",
                "text-sm font-semibold text-white",
                "transition-all duration-300 ease-out",
                "hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
              )}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c026d3 100%)',
                boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              }}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Part
              <Sparkles className="w-3 h-3 opacity-60" />
            </button>
          }
        />
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '100ms' }}>
        {[
          { label: 'Total Parts', value: items.length, icon: Package, color: 'purple', gradient: ['#8b5cf6', '#a855f7'] },
          { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: 'amber', gradient: ['#f59e0b', '#d97706'], warning: lowStock.length > 0 },
          { label: 'Out of Stock', value: outOfStock.length, icon: Package, color: 'rose', gradient: ['#f43f5e', '#e11d48'], warning: outOfStock.length > 0 },
          { label: 'Total Value', value: fmtMoney(totalValue), icon: DollarSign, color: 'emerald', gradient: ['#10b981', '#059669'] },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                "group relative rounded-xl p-4 overflow-hidden cursor-pointer",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-1"
              )}
              style={{
                background: stat.warning
                  ? `linear-gradient(135deg, ${stat.gradient[0]}15 0%, ${stat.gradient[1]}10 100%)`
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: stat.warning
                  ? `1px solid ${stat.gradient[0]}40`
                  : '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: stat.warning ? stat.gradient[0] : 'rgba(255, 255, 255, 0.3)' }}
                />
                {stat.warning && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: stat.gradient[0] }} />
                )}
              </div>
              <div className="text-xs text-white/50 mb-1">{stat.label}</div>
              <div
                className="text-xl font-bold"
                style={{ color: stat.warning ? stat.gradient[0] : 'white' }}
              >
                {stat.value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Category Pills */}
      <div className={cn(
        "flex items-center gap-2 overflow-x-auto pb-2 transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '150ms' }}>
        <button
          onClick={() => setCategory('all')}
          className={cn(
            'relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 inline-flex items-center gap-2 whitespace-nowrap',
            'hover:-translate-y-0.5',
            category === 'all' ? 'text-white' : 'text-white/60 hover:text-white/80'
          )}
          style={{
            background: category === 'all'
              ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
              : 'rgba(255, 255, 255, 0.03)',
            border: category === 'all' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: category === 'all' ? '0 8px 20px rgba(139, 92, 246, 0.4)' : 'none',
          }}
        >
          <Package className="w-4 h-4" />
          All
          <span className={cn(
            "px-1.5 py-0.5 rounded-md text-xs",
            category === 'all' ? "bg-white/20" : "bg-white/10"
          )}>
            {categoryCounts.all}
          </span>
        </button>
        {Object.entries(categoryInfo).map(([key, info]) => {
          const count = categoryCounts[key] || 0
          if (count === 0) return null
          const Icon = info.icon
          const isActive = category === key
          return (
            <button
              key={key}
              onClick={() => setCategory(key as InventoryCategory)}
              className={cn(
                'relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 inline-flex items-center gap-2 whitespace-nowrap',
                'hover:-translate-y-0.5',
                isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
              )}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${info.gradient[0]} 0%, ${info.gradient[1]} 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? `0 8px 20px ${info.gradient[0]}40` : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {info.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                isActive ? "bg-white/20" : "bg-white/10"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className={cn(
        "flex items-center gap-3 flex-wrap transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '200ms' }}>
        <div className="relative flex-1 max-w-[420px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-purple-400 transition-colors" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-2.5 rounded-xl",
              "bg-white/[0.03] border border-white/[0.08]",
              "text-sm text-white placeholder:text-white/40",
              "outline-none transition-all duration-300",
              "focus:border-purple-500/50 focus:bg-white/[0.05]",
              "focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
            )}
            placeholder="Search part, SKU, vendor, location…"
          />
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Filter className="w-4 h-4 text-white/40" />
          <select
            className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          >
            <option value="all">All stock levels</option>
            <option value="low">Low stock ({lowStock.length})</option>
            <option value="out">Out of stock ({outOfStock.length})</option>
            <option value="healthy">Healthy stock</option>
          </select>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.05]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Truck className="w-4 h-4 text-white/40" />
          <select
            className="bg-transparent text-sm text-white/75 outline-none cursor-pointer"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          >
            <option value="all">All vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "transition-all duration-500",
        animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )} style={{ transitionDelay: '250ms' }}>
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[160px] rounded-xl animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)',
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <Package className="w-7 h-7 text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No items match filters</h3>
            <p className="text-sm text-white/50 mb-6">Try adjusting your filters or search query.</p>
            <button
              className="px-5 py-3 rounded-xl text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onClick={() => {
                setQuery('')
                setCategory('all')
                setVendor('all')
                setStockFilter('all')
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Low Stock Alert */}
            {lowStock.length > 0 && stockFilter === 'all' && (
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-amber-200">Low Stock Alerts</div>
                    <div className="text-xs text-amber-300/60">Parts at or below minimum levels</div>
                  </div>
                  <button
                    onClick={() => setStockFilter('low')}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-amber-200 transition-all hover:bg-amber-500/20"
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    View All
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {lowStock.slice(0, 6).map((i, idx) => {
                    const info = categoryInfo[i.category]
                    const Icon = info.icon
                    return (
                      <div
                        key={i.id}
                        className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-amber-500/10"
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.15)',
                          animationDelay: `${idx * 50}ms`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${info.gradient[0]}30 0%, ${info.gradient[1]}20 100%)`,
                          }}
                        >
                          <Icon className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{i.name}</div>
                          <div className="text-xs text-amber-300">
                            {i.onHand} on hand (min {i.min})
                          </div>
                        </div>
                        <button
                          className="px-3 py-2 rounded-lg text-xs font-medium text-white whitespace-nowrap transition-all hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                          }}
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/inventory/reorder-suggestions', { cache: 'no-store' })
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}))
                                throw new Error(err?.error || 'Failed to fetch reorder suggestions')
                              }
                              const data = await res.json()
                              const suggestion = (data?.suggestions || []).find((s: any) => s.inventoryId === i.id)
                              if (!suggestion) return toast.info('No reorder suggestion found yet.')
                              toast.success(`Suggested reorder: ${suggestion.suggestedReorder}`)
                            } catch (e: any) {
                              toast.error(e?.message || 'Failed to fetch reorder suggestions')
                            }
                          }}
                        >
                          Reorder
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Parts Table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="text-sm font-semibold text-white/85">
                  {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                  {category !== 'all' && ` in ${categoryInfo[category].label}`}
                </div>
                <button
                  className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 inline-flex items-center gap-1 transition-all hover:bg-white/[0.08]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/inventory/reorder-suggestions', { cache: 'no-store' })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        throw new Error(err?.error || 'Failed to generate purchase order')
                      }
                      const data = await res.json()
                      const count = data?.summary?.totalItems ?? 0
                      toast.success(`Generated reorder suggestions for ${count} item${count === 1 ? '' : 's'}`)
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to generate purchase order')
                    }
                  }}
                >
                  <Truck className="w-3 h-3" /> Generate PO
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/[0.06]">
                      <th className="px-5 py-3">Part</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Vendor</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Cost / Retail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((i, idx) => {
                      const isLow = i.onHand <= i.min && i.onHand > 0
                      const isOut = i.onHand === 0
                      const info = categoryInfo[i.category]
                      const Icon = info.icon
                      return (
                        <tr
                          key={i.id}
                          className="border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.03]"
                          style={{ animationDelay: `${idx * 20}ms` }}
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-white">{i.name}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                              style={{
                                background: `linear-gradient(135deg, ${info.gradient[0]}20 0%, ${info.gradient[1]}10 100%)`,
                                color: info.gradient[0],
                              }}
                            >
                              <Icon className="w-3 h-3" />
                              {info.label}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-white/60 font-mono">{i.sku}</td>
                          <td className="px-5 py-4 text-sm text-white/60">{i.vendor}</td>
                          <td className="px-5 py-4">
                            {i.location ? (
                              <div className="inline-flex items-center gap-1 text-xs text-white/50">
                                <MapPin className="w-3 h-3" />
                                {i.location}
                              </div>
                            ) : (
                              <span className="text-xs text-white/30">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div
                              className="font-semibold text-sm"
                              style={{
                                color: isOut ? '#f87171' : isLow ? '#fbbf24' : '#34d399',
                              }}
                            >
                              {i.onHand}
                            </div>
                            <div className="text-xs text-white/40">min {i.min}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-sm text-white/60">{fmtMoney(i.unitCost)}</div>
                            <div className="text-sm font-semibold text-white">
                              {i.retail > 0 ? fmtMoney(i.retail) : '—'}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={openAdd}
        onOpenChange={(o) => (o ? router.push('/inventory?add=1') : closeAdd())}
        title="Add part"
        description="Create a new inventory item"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-white/60 mb-1.5">Part name</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="iPhone 14 Pro Screen (OEM)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Category</label>
            <select
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white",
                "outline-none cursor-pointer"
              )}
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as InventoryCategory }))}
            >
              {Object.entries(categoryInfo).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">SKU</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="IP14P-SCR-OEM"
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Vendor</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="PrimeParts"
              value={form.vendor}
              onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Location</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="Bin A-1"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">On hand</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="0"
              type="number"
              value={form.onHand}
              onChange={(e) => setForm((p) => ({ ...p, onHand: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Minimum</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="5"
              type="number"
              value={form.min}
              onChange={(e) => setForm((p) => ({ ...p, min: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Unit cost</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="$0.00"
              value={form.unitCost}
              onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Retail price</label>
            <input
              className={cn(
                "w-full px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-sm text-white placeholder:text-white/40",
                "outline-none transition-all duration-300",
                "focus:border-purple-500/50 focus:bg-white/[0.05]"
              )}
              placeholder="$0.00"
              value={form.retail}
              onChange={(e) => setForm((p) => ({ ...p, retail: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button
              className="px-4 py-3 rounded-xl text-sm font-medium text-white/70 transition-all hover:bg-white/[0.08]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              onClick={closeAdd}
            >
              Cancel
            </button>
            <button
              className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
              }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Part'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

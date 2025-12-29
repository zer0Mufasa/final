'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ticket,
  Phone,
  User,
  Smartphone,
  AlertCircle,
  Shield,
  Clock,
  DollarSign,
  FileText,
  Check,
  X,
  ScanLine,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { mockCustomers } from '@/lib/mock/data'
import { parseIntakeText } from '@/lib/ai/intake-parser'

type DeviceCategoryKey =
  | 'iphone'
  | 'samsung'
  | 'ipad'
  | 'tablet'
  | 'macbook'
  | 'laptop'
  | 'switch'
  | 'ps5'
  | 'xbox'

const deviceCatalog: Record<
  DeviceCategoryKey,
  {
    key: DeviceCategoryKey
    label: string
    deviceType: 'Phone' | 'Tablet' | 'Laptop' | 'Console'
    brand: string
    models: string[]
    imageSrc: string
  }
> = {
  iphone: {
    key: 'iphone',
    label: 'iPhone',
    deviceType: 'Phone',
    brand: 'Apple',
    models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13', 'iPhone 12'],
    imageSrc: '/devices/iphone.svg',
  },
  samsung: {
    key: 'samsung',
    label: 'Samsung',
    deviceType: 'Phone',
    brand: 'Samsung',
    models: ['Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22', 'Galaxy A54'],
    imageSrc: '/devices/samsung.svg',
  },
  ipad: {
    key: 'ipad',
    label: 'iPad',
    deviceType: 'Tablet',
    brand: 'Apple',
    models: ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad mini', 'iPad (Standard)'],
    imageSrc: '/devices/ipad.svg',
  },
  tablet: {
    key: 'tablet',
    label: 'Tablet',
    deviceType: 'Tablet',
    brand: 'Other',
    models: ['Galaxy Tab S9', 'Galaxy Tab A8', 'Amazon Fire HD', 'Other / Custom'],
    imageSrc: '/devices/tablet.svg',
  },
  macbook: {
    key: 'macbook',
    label: 'MacBook',
    deviceType: 'Laptop',
    brand: 'Apple',
    models: ['MacBook Pro 16"', 'MacBook Pro 14"', 'MacBook Air 15"', 'MacBook Air 13"'],
    imageSrc: '/devices/macbook.svg',
  },
  laptop: {
    key: 'laptop',
    label: 'Laptop',
    deviceType: 'Laptop',
    brand: 'Other',
    models: ['Dell XPS 13', 'Lenovo ThinkPad', 'HP Spectre', 'Acer Aspire', 'Other / Custom'],
    imageSrc: '/devices/laptop.svg',
  },
  switch: {
    key: 'switch',
    label: 'Nintendo Switch',
    deviceType: 'Console',
    brand: 'Nintendo',
    models: ['Switch OLED', 'Switch', 'Switch Lite'],
    imageSrc: '/devices/switch.svg',
  },
  ps5: {
    key: 'ps5',
    label: 'PS5',
    deviceType: 'Console',
    brand: 'Sony',
    models: ['PS5', 'PS5 Slim', 'PS5 Digital'],
    imageSrc: '/devices/ps5.svg',
  },
  xbox: {
    key: 'xbox',
    label: 'Xbox',
    deviceType: 'Console',
    brand: 'Microsoft',
    models: ['Xbox Series X', 'Xbox Series S'],
    imageSrc: '/devices/xbox.svg',
  },
}

const deviceCategoryOrder: DeviceCategoryKey[] = [
  'iphone',
  'samsung',
  'ipad',
  'tablet',
  'macbook',
  'laptop',
  'switch',
  'ps5',
  'xbox',
]

function inferCategory(brand: string, model: string): DeviceCategoryKey | null {
  const b = (brand || '').toLowerCase()
  const m = (model || '').toLowerCase()
  if (m.includes('iphone')) return 'iphone'
  if (b.includes('samsung') || m.includes('galaxy')) return 'samsung'
  if (m.includes('ipad')) return 'ipad'
  if (m.includes('macbook')) return 'macbook'
  if (m.includes('switch') || b.includes('nintendo')) return 'switch'
  if (m.includes('ps5') || m.includes('playstation') || b.includes('sony')) return 'ps5'
  if (m.includes('xbox') || b.includes('microsoft')) return 'xbox'
  if (m.includes('tablet')) return 'tablet'
  if (m.includes('laptop')) return 'laptop'
  return null
}

type IntakeForm = {
  // Step 1: Customer
  phone: string
  customerName: string
  email: string
  isNewCustomer: boolean
  customerId: string | null

  // Step 2: Device
  deviceCategory: DeviceCategoryKey | null
  deviceType: string
  brand: string
  model: string
  imei: string
  serial: string

  // Step 3: Problem
  issue: string

  // Step 4: Condition
  powersOn: boolean
  touchWorks: boolean
  faceIdWorks: boolean
  waterExposure: boolean
  dataBackedUp: boolean

  // Step 5: Quote
  estimatedRange: string
  timeEstimate: string

  // Step 6: Consent
  repairAuthorized: boolean
  dataRiskAcknowledged: boolean
  signature: string | null
  signLater: boolean

  // Step 7: Create
  ticketCreated: boolean
  ticketNumber: string | null
}

const steps = [
  { key: 1, label: 'Customer', icon: User },
  { key: 2, label: 'Device', icon: Smartphone },
  { key: 3, label: 'Problem', icon: AlertCircle },
  { key: 4, label: 'Condition', icon: CheckCircle2 },
  { key: 5, label: 'Quote', icon: DollarSign },
  { key: 6, label: 'Consent', icon: Shield },
  { key: 7, label: 'Create', icon: Ticket },
]

export function NewTicketClient() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<IntakeForm>({
    phone: '',
    customerName: '',
    email: '',
    isNewCustomer: false,
    customerId: null,
    deviceCategory: null,
    deviceType: '',
    brand: '',
    model: '',
    imei: '',
    serial: '',
    issue: '',
    powersOn: false,
    touchWorks: false,
    faceIdWorks: false,
    waterExposure: false,
    dataBackedUp: false,
    estimatedRange: '',
    timeEstimate: '',
    repairAuthorized: false,
    dataRiskAcknowledged: false,
    signature: null,
    signLater: false,
    ticketCreated: false,
    ticketNumber: null,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [quickStatus, setQuickStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [customModel, setCustomModel] = useState(false)

  // Auto-fill customer when phone is entered
  useEffect(() => {
    if (form.phone.length >= 10) {
      const found = mockCustomers.find((c) => c.phone.replace(/\D/g, '') === form.phone.replace(/\D/g, ''))
      if (found) {
        setForm((p) => ({
          ...p,
          customerName: found.name,
          email: found.email || '',
          isNewCustomer: false,
          customerId: found.id,
        }))
        setShowCustomerSearch(false)
      } else {
        setForm((p) => ({ ...p, isNewCustomer: true, customerId: null }))
      }
    }
  }, [form.phone])

  const setField = (k: keyof IntakeForm, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const formatPhone = (digits: string) => {
    const val = (digits || '').replace(/\D/g, '').slice(0, 10)
    if (val.length <= 3) return val
    if (val.length <= 6) return `(${val.slice(0, 3)}) ${val.slice(3)}`
    return `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6, 10)}`
  }

  const deviceTypeFromParsed = (deviceType: string) => {
    const t = (deviceType || '').toLowerCase()
    if (t.includes('ipad') || t.includes('tablet')) return 'Tablet'
    if (t.includes('macbook') || t.includes('laptop') || t.includes('thinkpad') || t.includes('surface')) return 'Laptop'
    if (t.includes('playstation') || t.includes('xbox') || t.includes('switch') || t.includes('console')) return 'Console'
    return 'Phone'
  }

  const firstIncompleteStep = (nextForm: IntakeForm) => {
    if ((nextForm.phone || '').replace(/\D/g, '').length < 10 || !nextForm.customerName.trim()) return 1
    if (!nextForm.deviceCategory || !nextForm.deviceType || !nextForm.brand.trim() || !nextForm.model.trim()) return 2
    if (!nextForm.issue.trim()) return 3
    return 4
  }

  const handleQuickFill = () => {
    const text = quickText.trim()
    if (!text) {
      setQuickStatus({ ok: false, message: 'Type one sentence and hit Fill.' })
      return
    }

    try {
      const parsed = parseIntakeText(text)
      const parsedPhoneDigits = (parsed.customer.phone || '').replace(/\D/g, '').slice(0, 10)
      const name = `${parsed.customer.firstName || ''} ${parsed.customer.lastName || ''}`.trim()
      const model = (parsed.device.model || parsed.device.type || '').trim()
      const inferredCategory = inferCategory((parsed.device.brand || '').trim(), model)

      const nextForm: IntakeForm = {
        ...form,
        phone: parsedPhoneDigits ? formatPhone(parsedPhoneDigits) : form.phone,
        customerName: name || form.customerName,
        email: parsed.customer.email || form.email,
        isNewCustomer: form.isNewCustomer,
        customerId: form.customerId,
        deviceCategory: inferredCategory || form.deviceCategory,
        deviceType: model ? deviceTypeFromParsed(model) : (form.deviceType || 'Phone'),
        brand: (parsed.device.brand || '').trim() || form.brand,
        model: model || form.model,
        issue: (parsed.issue || '').trim() || form.issue,
        estimatedRange: parsed.estimatedPriceRange ? `$${parsed.estimatedPriceRange.min} - $${parsed.estimatedPriceRange.max}` : form.estimatedRange,
      }

      setForm(nextForm)
      setStep(firstIncompleteStep(nextForm))
      setQuickStatus({
        ok: true,
        message: `Filled ${[
          parsedPhoneDigits || name ? 'customer' : null,
          parsed.device.brand || model ? 'device' : null,
          parsed.issue ? 'problem' : null,
        ].filter(Boolean).join(', ') || 'fields'} • ${parsed.confidence?.overall ?? 72}% confidence`,
      })
    } catch {
      setQuickStatus({ ok: false, message: 'Couldn’t parse that sentence. Try: “Jordan Lee 5125550142 iPhone 14 Pro cracked screen.”' })
    }
  }

  const next = () => {
    if (step < steps.length) {
      setStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const back = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCreateTicket = () => {
    // Mock ticket creation
    const ticketNum = `FIX-${Math.floor(Math.random() * 9000) + 1000}`
    setForm((p) => ({ ...p, ticketCreated: true, ticketNumber: ticketNum }))
    setStep(7)
  }

  const canProceed = () => {
    if (step === 1) return form.phone.length >= 10 && form.customerName.length > 0
    if (step === 2) return !!form.deviceCategory && !!form.deviceType && !!form.brand && !!form.model
    if (step === 3) return form.issue.length > 10
    if (step === 4) return true // All optional
    if (step === 5) return true // Optional estimate
    if (step === 6) return form.repairAuthorized && form.dataRiskAcknowledged && (form.signature || form.signLater)
    return false
  }

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const progress = (step / steps.length) * 100

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl font-bold text-white/90">Front Desk Intake</h1>
              <p className="text-xs text-white/50 mt-0.5">Step {step} of {steps.length} • {steps[step - 1].label}</p>
            </div>
            <Link href="/tickets" className="btn-secondary px-4 py-2 rounded-xl text-sm">
              Cancel
            </Link>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400/90 to-purple-600/90 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.key
              const isComplete = step > s.key
              return (
                <button
                  key={s.key}
                  onClick={() => step > s.key && setStep(s.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 flex-1 transition-all',
                    isActive && 'scale-105',
                    step <= s.key && 'cursor-default'
                  )}
                  disabled={step <= s.key}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                      isComplete && 'bg-green-500/20 border border-green-400/30',
                      isActive && 'bg-purple-500/20 border border-purple-400/30',
                      !isComplete && !isActive && 'bg-white/5 border border-white/10'
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4 text-green-300" />
                    ) : (
                      <Icon className={cn('w-4 h-4', isActive ? 'text-purple-300' : 'text-white/40')} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold text-center',
                      isActive ? 'text-white' : isComplete ? 'text-white/60' : 'text-white/40'
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto mt-6 px-4 sm:px-6">
        {/* Quick Intake (optional) */}
        {!form.ticketCreated && step <= 3 && (
          <GlassCard className="p-5 sm:p-6 rounded-3xl mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">Quick intake</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    Paste one sentence — we’ll prefill fields. Doesn’t block intake.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickText('')
                  setQuickStatus(null)
                }}
                className="btn-ghost px-3 py-2 rounded-xl text-xs"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[120px] resize-none"
                placeholder='Try: “Jordan Lee 5125550142 iPhone 14 Pro cracked screen — wants same-day.”'
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickText('Jordan Lee 5125550142 iPhone 14 Pro cracked screen wants same-day')
                    setQuickStatus(null)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  Use example
                </button>
                <span className="text-xs text-white/40">Tip: include name + phone + device + issue.</span>
              </div>

              {quickStatus && (
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 border text-xs',
                    quickStatus.ok
                      ? 'bg-green-500/10 border-green-400/30 text-green-200'
                      : 'bg-yellow-500/10 border-yellow-400/30 text-yellow-200'
                  )}
                >
                  {quickStatus.message}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickFill}
                  className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Fill form
                </button>
                <div className="text-xs text-white/45">
                  You can still edit anything — <span className="text-white/65 font-semibold">nothing final yet</span>.
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 1: Customer */}
        {step === 1 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Customer Information</h2>
                  <p className="text-xs text-white/50 mt-0.5">Start with phone number — we'll find them if they exist</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Phone (primary) */}
                <div>
                  <label className="label mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        const formatted = val.length > 6 ? `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6, 10)}` : val.length > 3 ? `(${val.slice(0, 3)}) ${val.slice(3)}` : val
                        setField('phone', formatted)
                        setShowCustomerSearch(true)
                      }}
                      className="input pl-12 bg-white/[0.04] border-white/10 text-lg"
                      placeholder="(555) 123-4567"
                      autoFocus
                    />
                  </div>
                  {form.phone.length > 0 && form.phone.length < 14 && (
                    <p className="text-xs text-yellow-300/70 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Enter full phone number to search
                    </p>
                  )}
                </div>

                {/* Customer status badge */}
                {form.phone.length >= 14 && (
                  <div
                    className={cn(
                      'rounded-2xl p-4 border transition-all',
                      form.isNewCustomer
                        ? 'bg-blue-500/10 border-blue-400/30'
                        : 'bg-green-500/10 border-green-400/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {form.isNewCustomer ? (
                        <>
                          <User className="w-5 h-5 text-blue-300" />
                          <div>
                            <div className="text-sm font-semibold text-white/90">First visit</div>
                            <div className="text-xs text-white/50 mt-0.5">We'll create a new customer profile</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-300" />
                          <div>
                            <div className="text-sm font-semibold text-white/90">Returning customer</div>
                            <div className="text-xs text-white/50 mt-0.5">Found in system — information auto-filled</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer search dropdown */}
                {showCustomerSearch && form.phone.length >= 10 && !form.customerId && (
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input bg-white/[0.04] border-white/10 mb-2"
                      placeholder="Search by name, phone, or email..."
                    />
                    {filteredCustomers.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setField('phone', c.phone)
                          setField('customerName', c.name)
                          setField('email', c.email || '')
                          setField('customerId', c.id)
                          setField('isNewCustomer', false)
                          setShowCustomerSearch(false)
                        }}
                        className="w-full text-left rounded-xl bg-white/[0.03] border border-white/10 p-3 hover:bg-white/[0.05] transition-colors mb-2"
                      >
                        <div className="text-sm font-semibold text-white/90">{c.name}</div>
                        <div className="text-xs text-white/50 mt-0.5">{c.phone} • {c.email || 'No email'}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="label mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setField('customerName', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="Full name"
                    disabled={!form.isNewCustomer && form.customerId !== null}
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="label mb-2">
                    Email <span className="text-white/40 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Trust microcopy */}
              <div className="mt-6 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white/70 font-semibold">Nothing final yet.</span> You can update customer information anytime before creating the ticket.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 2: Device */}
        {step === 2 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Device Information</h2>
                  <p className="text-xs text-white/50 mt-0.5">Choose a category — we’ll auto-fill brand + type</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-3">Device category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {deviceCategoryOrder.map((k) => {
                      const c = deviceCatalog[k]
                      const selected = form.deviceCategory === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setCustomModel(false)
                            setForm((p) => ({
                              ...p,
                              deviceCategory: k,
                              deviceType: c.deviceType,
                              brand: c.brand,
                              model: '',
                            }))
                          }}
                          className={cn(
                            'rounded-2xl border p-4 text-left transition-all',
                            selected ? 'bg-purple-500/15 border-purple-400/30' : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06]'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center overflow-hidden">
                              <img src={c.imageSrc} alt={c.label} className="w-10 h-10 opacity-90" />
                            </div>
                            <div className="min-w-0">
                              <div className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-white/80')}>{c.label}</div>
                              <div className="text-[11px] text-white/45 mt-0.5">{c.deviceType}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model selection */}
                {form.deviceCategory ? (
                  <div>
                    <label className="label mb-3">Which device is it? *</label>
                    <div className="flex flex-wrap gap-2">
                      {deviceCatalog[form.deviceCategory].models.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            if (m.toLowerCase().includes('other')) {
                              setCustomModel(true)
                              setField('model', '')
                              return
                            }
                            setCustomModel(false)
                            setField('model', m)
                          }}
                          className={cn(
                            'px-3 py-2 rounded-xl border text-xs font-semibold transition-colors',
                            form.model === m && !customModel
                              ? 'bg-purple-500/20 border-purple-400/30 text-white'
                              : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06] hover:text-white'
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {customModel && (
                      <div className="mt-3">
                        <label className="label mb-2">Model (custom)</label>
                        <input
                          type="text"
                          value={form.model}
                          onChange={(e) => setField('model', e.target.value)}
                          className="input bg-white/[0.04] border-white/10"
                          placeholder="Type model (e.g., Lenovo Yoga 7i)"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-yellow-500/10 border border-yellow-400/25 px-4 py-3 text-xs text-yellow-200">
                    Pick a category first — it will auto-fill brand and device type.
                  </div>
                )}

                {/* Auto-filled summary */}
                <div>
                  <label className="label mb-2">Auto-filled</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                      <div className="text-[11px] text-white/45 font-semibold uppercase tracking-wider">Brand</div>
                      <div className="text-sm text-white/85 font-semibold mt-1">{form.brand || '—'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                      <div className="text-[11px] text-white/45 font-semibold uppercase tracking-wider">Device</div>
                      <div className="text-sm text-white/85 font-semibold mt-1">{form.model || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Identifiers */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label mb-2">
                      IMEI <span className="text-white/40 text-xs">(phones/tablets)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.imei}
                        onChange={(e) => setField('imei', e.target.value)}
                        className="input pr-12 bg-white/[0.04] border-white/10"
                        placeholder="15 digits"
                        maxLength={15}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                        title="Scan IMEI"
                        type="button"
                      >
                        <Camera className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label mb-2">
                      Serial <span className="text-white/40 text-xs">(laptops/consoles)</span>
                    </label>
                    <input
                      type="text"
                      value={form.serial}
                      onChange={(e) => setField('serial', e.target.value)}
                      className="input bg-white/[0.04] border-white/10"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    <span className="text-xs text-white/55">
                      Category + model helps Fixology prefill parts, risk checks, and estimates. (UI only)
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 3: Problem */}
        {step === 3 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">What's Wrong?</h2>
                  <p className="text-xs text-white/50 mt-0.5">Describe the problem in plain language</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Quick issue presets */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Quick options</div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const isConsole = form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                      const opts = isConsole
                        ? ['HDMI', 'No Power', 'Overheating', 'Diagnostic']
                        : ['Screen', 'Battery', 'Diagnostic', 'Other']
                      return opts.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const preset =
                              opt === 'Screen'
                                ? 'Screen issue — '
                                : opt === 'Battery'
                                  ? 'Battery / power issue — '
                                  : opt === 'Diagnostic'
                                    ? 'Needs diagnostic — '
                                    : opt === 'HDMI'
                                      ? 'HDMI issue — '
                                      : opt === 'No Power'
                                        ? 'No power — '
                                        : opt === 'Overheating'
                                          ? 'Overheating — '
                                          : ''
                            setField('issue', preset)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          {opt}
                        </button>
                      ))
                    })()}
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    These don’t lock you in — they just start the sentence.
                  </div>
                </div>

                {/* Issue field */}
                <div>
                  <label className="label mb-2">What's wrong with the device? *</label>
                  <textarea
                    value={form.issue}
                    onChange={(e) => setField('issue', e.target.value)}
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[140px] resize-none"
                    placeholder={
                      form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                        ? 'HDMI issue, no power, overheating, fan noise…'
                        : 'Screen cracked, not charging, battery drain, water damage…'
                    }
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span className="text-xs text-white/50">AI can auto-diagnose</span>
                    </div>
                    <span className="text-xs text-white/40">{form.issue.length} characters</span>
                  </div>
                </div>

                {/* Example placeholders */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Examples:</div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const isConsole = form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                      const examples = isConsole
                        ? ['HDMI no signal', 'No power', 'Overheating shutdown', 'Turns on then off', 'Fan loud + crash']
                        : ['Screen cracked', 'Not charging', 'Battery drains fast', "Won't turn on", 'Touch not working']
                      return examples.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setField('issue', ex)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        {ex}
                      </button>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 4: Condition Check */}
        {step === 4 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Device Condition</h2>
                  <p className="text-xs text-white/50 mt-0.5">Quick visual check — tap to confirm</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'powersOn', label: 'Powers on', icon: Zap },
                  { key: 'touchWorks', label: 'Touch works', icon: CheckCircle2 },
                  { key: 'faceIdWorks', label: 'Face ID works', icon: Shield },
                  { key: 'waterExposure', label: 'Water exposure', icon: AlertCircle },
                  { key: 'dataBackedUp', label: 'Data backed up', icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon
                  const checked = form[item.key as keyof IntakeForm] as boolean
                  return (
                    <button
                      key={item.key}
                      onClick={() => setField(item.key as keyof IntakeForm, !checked)}
                      className={cn(
                        'rounded-2xl p-4 border transition-all text-left',
                        checked
                          ? 'bg-green-500/10 border-green-400/30'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                            checked ? 'bg-green-500/20' : 'bg-white/[0.05]'
                          )}
                        >
                          {checked ? (
                            <Check className="w-5 h-5 text-green-300" />
                          ) : (
                            <Icon className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={cn('text-sm font-semibold', checked ? 'text-white' : 'text-white/70')}>
                            {item.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  All checks are optional. You can update these later during diagnosis.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 5: Quote Snapshot */}
        {step === 5 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Estimated Quote</h2>
                  <p className="text-xs text-white/50 mt-0.5">Non-binding estimate — final price after diagnosis</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-2">Estimated Price Range</label>
                  <input
                    type="text"
                    value={form.estimatedRange}
                    onChange={(e) => setField('estimatedRange', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="$150 - $250"
                  />
                </div>

                <div>
                  <label className="label mb-2">Estimated Time</label>
                  <input
                    type="text"
                    value={form.timeEstimate}
                    onChange={(e) => setField('timeEstimate', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="2-3 hours, Same day, 1-2 days..."
                  />
                </div>

                <div className="rounded-2xl bg-yellow-500/10 border border-yellow-400/30 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white/90 mb-1">Estimated — not final</div>
                      <div className="text-xs text-white/60 leading-relaxed">
                        This is a preliminary estimate. Final pricing will be confirmed after diagnosis. You stay in control.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 6: Customer Consent */}
        {step === 6 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Customer Consent</h2>
                  <p className="text-xs text-white/50 mt-0.5">Authorization and acknowledgment</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Repair authorization */}
                <label className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.repairAuthorized}
                    onChange={(e) => setField('repairAuthorized', e.target.checked)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white/90">Repair Authorization</div>
                    <div className="text-xs text-white/50 mt-1">Customer authorizes repair work to proceed</div>
                  </div>
                </label>

                {/* Data risk */}
                <label className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.dataRiskAcknowledged}
                    onChange={(e) => setField('dataRiskAcknowledged', e.target.checked)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white/90">Data Risk Acknowledgment</div>
                    <div className="text-xs text-white/50 mt-1">Customer understands data loss risks</div>
                  </div>
                </label>

                {/* Signature */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white/90 mb-3">Signature</div>
                  <div className="space-y-3">
                    <div className="h-24 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                      {form.signature ? (
                        <div className="text-sm text-white/70">Signature captured</div>
                      ) : (
                        <div className="text-xs text-white/40 text-center px-4">Draw signature here (UI only)</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setField('signature', 'captured')}
                        className="btn-secondary px-4 py-2 rounded-xl text-sm flex-1"
                      >
                        Capture Signature
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer hover:bg-white/[0.06] transition-colors">
                        <input
                          type="checkbox"
                          checked={form.signLater}
                          onChange={(e) => {
                            setField('signLater', e.target.checked)
                            if (e.target.checked) setField('signature', null)
                          }}
                          className="accent-purple-500"
                        />
                        <span className="text-xs text-white/70">Sign later</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 7: Create Ticket */}
        {step === 7 && (
          <div className="space-y-6">
            {form.ticketCreated ? (
              <GlassCard className="p-6 sm:p-8 rounded-3xl text-center">
                <div className="w-16 h-16 rounded-3xl bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-bold text-white/90 mb-2">Ticket Created!</h2>
                <div className="text-lg font-semibold text-purple-300 mb-6">{form.ticketNumber}</div>
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-left">
                    <div className="text-xs text-white/50 mb-1">Status</div>
                    <div className="text-sm font-semibold text-white/90">Intake</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-left">
                    <div className="text-xs text-white/50 mb-1">Next Step</div>
                    <div className="text-sm font-semibold text-white/90">Device will be diagnosed</div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href={`/tickets/${form.ticketNumber?.toLowerCase()}`} className="btn-primary px-6 py-3 rounded-xl">
                    View Ticket
                  </Link>
                  <Link href="/tickets/new" className="btn-secondary px-6 py-3 rounded-xl">
                    Create Another
                  </Link>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6 sm:p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90">Ready to Create</h2>
                    <p className="text-xs text-white/50 mt-0.5">Review and create your repair ticket</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Customer</div>
                    <div className="text-sm font-semibold text-white/90">{form.customerName}</div>
                    <div className="text-xs text-white/50 mt-1">{form.phone}</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Device</div>
                    <div className="text-sm font-semibold text-white/90">
                      {form.brand} {form.model}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Issue</div>
                    <div className="text-sm text-white/80">{form.issue || '—'}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-green-500/10 border border-green-400/30 p-4 mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-300 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    All required fields complete
                  </div>
                  <div className="text-xs text-white/60">Ready to create ticket</div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={handleCreateTicket} className="btn-primary px-6 py-4 rounded-xl text-base font-semibold flex-1">
                    Create Repair Ticket
                  </button>
                  <button onClick={() => setStep(6)} className="btn-secondary px-6 py-4 rounded-xl">
                    Save & Finish Later
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {step < 7 && !form.ticketCreated && (
          <div className="sticky bottom-0 bg-black/40 backdrop-blur-xl border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-8">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 1}
                className="btn-secondary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={next}
                disabled={!canProceed()}
                className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'

type BusinessHoursDay = {
  closed?: boolean
  open?: string
  close?: string
}

type BusinessHours = Record<string, BusinessHoursDay>

type InitialData = {
  step: number
  ownerName: string
  shop: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    timezone: string
    repairFocus: string[]
    businessHours: BusinessHours
    features: any
  }
}

const repairFocusOptions = [
  'iPhone screens',
  'Batteries',
  'Charging ports',
  'Back glass',
  'Camera repairs',
  'iPad screens',
  'Game consoles',
  'HDMI ports',
  'Microsoldering',
  'Water damage',
  'Data recovery',
  'Laptop repair',
]

const supplierBadges = [
  'MobileSentrix',
  'Injured Gadgets',
  'iFixit',
  'Wholesale Gadget Parts',
  'GadgetFix',
]

const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function defaultBusinessHours(): BusinessHours {
  return {
    Mon: { open: '09:00', close: '18:00', closed: false },
    Tue: { open: '09:00', close: '18:00', closed: false },
    Wed: { open: '09:00', close: '18:00', closed: false },
    Thu: { open: '09:00', close: '18:00', closed: false },
    Fri: { open: '09:00', close: '18:00', closed: false },
    Sat: { open: '10:00', close: '16:00', closed: false },
    Sun: { closed: true },
  }
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPhone(v: string) {
  return v.replace(/\D/g, '').length >= 10
}

async function postJson(url: string, payload: any) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export function OnboardingWizard({ initial }: { initial: InitialData }) {
  const router = useRouter()

  const [step, setStep] = useState<number>(initial.step || 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  const [shopName, setShopName] = useState(initial.shop.name || '')
  const [street, setStreet] = useState(initial.shop.address || '')
  const [city, setCity] = useState(initial.shop.city || '')
  const [state, setState] = useState(initial.shop.state || '')
  const [zip, setZip] = useState(initial.shop.zip || '')
  const [phone, setPhone] = useState(initial.shop.phone || '')
  const [timezone, setTimezone] = useState(
    initial.shop.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  const [repairFocus, setRepairFocus] = useState<string[]>(
    Array.isArray(initial.shop.repairFocus) ? initial.shop.repairFocus : []
  )

  const [techEmail, setTechEmail] = useState<string>(
    (initial.shop.features?.pending_tech_invite as string) || ''
  )

  const [emailUpdates, setEmailUpdates] = useState<boolean>(
    typeof initial.shop.features?.email_updates === 'boolean'
      ? initial.shop.features.email_updates
      : true
  )
  const [smsUpdates, setSmsUpdates] = useState<boolean>(
    typeof initial.shop.features?.sms_updates === 'boolean'
      ? initial.shop.features.sms_updates
      : false
  )

  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    const existing = initial.shop.businessHours
    if (existing && typeof existing === 'object') return existing
    return defaultBusinessHours()
  })

  const progressPct = useMemo(() => (step / 5) * 100, [step])

  const headline = useMemo(() => {
    return step === 1
      ? 'Shop basics'
      : step === 2
        ? 'What you repair most'
        : step === 3
          ? 'Invite your team (optional)'
          : step === 4
            ? 'Messaging + business hours'
            : 'Fixology is ready'
  }, [step])

  const subhead = useMemo(() => {
    return step === 1
      ? 'This makes your dashboard feel like your shop — not an empty warehouse.'
      : step === 2
        ? 'Pick your top repairs. We’ll tailor templates and suggestions.'
        : step === 3
          ? 'Invite one technician now or skip — you can add more later.'
          : step === 4
            ? 'Set when Fixology should message customers (and when it shouldn’t).'
            : 'Prebuilt templates loaded. Best-practice workflows included.'
  }, [step])

  const canContinue = useMemo(() => {
    if (saving) return false
    if (step === 1) {
      return !!shopName.trim() && !!timezone.trim() && isValidPhone(phone)
    }
    if (step === 2) {
      return repairFocus.length > 0 && repairFocus.length <= 6
    }
    if (step === 3) {
      return techEmail ? isValidEmail(techEmail) : true
    }
    if (step === 4) {
      return true
    }
    return true
  }, [saving, step, shopName, timezone, phone, repairFocus, techEmail])

  const saveStep = async (overrideStep?: number) => {
    const currentStep = overrideStep ?? step
    const payload: any = { step: currentStep }

    if (currentStep === 1) {
      payload.shop = {
        name: shopName.trim(),
        address: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
        timezone: timezone.trim(),
      }
    }

    if (currentStep === 2) {
      payload.repairFocus = repairFocus
    }

    if (currentStep === 3) {
      payload.team = { techEmail: techEmail.trim() }
    }

    if (currentStep === 4) {
      payload.messaging = { emailUpdates, smsUpdates }
      payload.businessHours = businessHours
    }

    await postJson('/api/onboarding/save', payload)
  }

  const handleContinue = async () => {
    setError('')
    setSaving(true)
    try {
      // Light validation messaging
      if (step === 1) {
        if (!shopName.trim()) throw new Error('Shop name is required.')
        if (!timezone.trim()) throw new Error('Timezone is required.')
        if (!isValidPhone(phone)) throw new Error('A valid phone number is required.')
      }
      if (step === 2) {
        if (repairFocus.length === 0) throw new Error('Pick at least 1 repair focus.')
        if (repairFocus.length > 6) throw new Error('Pick up to 6 items.')
      }
      if (step === 3 && techEmail && !isValidEmail(techEmail)) {
        throw new Error('Enter a valid email or leave it blank.')
      }

      await saveStep(step)

      if (step < 5) {
        setStep(step + 1)
        // record next step as the resume point
        await postJson('/api/onboarding/save', { step: step + 1 })
      } else {
        await postJson('/api/onboarding/complete', {})
        toast.success('Setup complete. Welcome to Fixology.')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (e: any) {
      const msg = e?.message || 'Could not save. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = async () => {
    setError('')
    if (step <= 1) return
    setStep(step - 1)
    try {
      await postJson('/api/onboarding/save', { step: step - 1 })
    } catch {
      // ignore resume-save failure
    }
  }

  return (
    <div className="min-h-screen">
      <div className="glow-spot" style={{ top: '10%', left: '10%' }} />
      <div className="glow-spot" style={{ bottom: '12%', right: '12%', opacity: 0.75 }} />

      <div className="wide-container" style={{ paddingTop: 120, paddingBottom: 96 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(167,139,250,.12)',
                border: '1px solid rgba(167,139,250,.22)',
                color: 'rgba(196,181,253,.95)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                marginBottom: 14,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'rgba(74,222,128,.9)' }} />
              2–3 minute shop setup • Step {step} of 5
            </div>
            <h1 className="section-title" style={{ fontSize: 'clamp(34px, 4vw, 52px)', marginBottom: 10 }}>
              {headline}
            </h1>
            <p style={{ color: 'rgba(196,181,253,.75)', fontSize: 16, lineHeight: 1.7, margin: '0 auto', maxWidth: 760 }}>
              {subhead}
            </p>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 10,
              background: 'rgba(167,139,250,.12)',
              borderRadius: 999,
              overflow: 'hidden',
              border: '1px solid rgba(167,139,250,.18)',
              marginBottom: 22,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, rgba(167,139,250,.95), rgba(196,181,253,.95))',
                transition: 'width .25s ease',
              }}
            />
          </div>

          <div
            className="glass-card"
            style={{
              padding: 28,
              border: '1px solid rgba(167,139,250,.22)',
              boxShadow: '0 18px 60px rgba(0,0,0,0.35)',
            }}
          >
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
                <div>
                  <label className="auth-label">Shop name</label>
                  <input
                    className="auth-input"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g., Midtown Device Repair"
                  />
                </div>
                <div>
                  <label className="auth-label">Phone</label>
                  <input
                    className="auth-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    inputMode="tel"
                  />
                  <p className="auth-muted" style={{ marginTop: 8, fontSize: 12 }}>
                    Used for call confirmations and support.
                  </p>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="auth-label">Address</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.6fr', gap: 12 }}>
                    <input
                      className="auth-input"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Street"
                    />
                    <input className="auth-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                    <input className="auth-input" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1fr', gap: 12, marginTop: 12 }}>
                    <input className="auth-input" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" />
                    <input
                      className="auth-input"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Timezone"
                    />
                  </div>
                  <p className="auth-muted" style={{ marginTop: 8, fontSize: 12 }}>
                    Timezone auto-detected. Update if your shop is in a different location.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Pick your top repairs</div>
                    <div style={{ fontSize: 13, color: 'rgba(196,181,253,.7)', lineHeight: 1.6 }}>
                      Choose up to 6. This personalizes templates, examples, and suggested workflows.
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(196,181,253,.65)' }}>{repairFocus.length}/6 selected</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                  {repairFocusOptions.map((opt) => {
                    const active = repairFocus.includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setRepairFocus((prev) => {
                            if (prev.includes(opt)) return prev.filter((x) => x !== opt)
                            if (prev.length >= 6) return prev
                            return [...prev, opt]
                          })
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 999,
                          border: active ? '1px solid rgba(74,222,128,.45)' : '1px solid rgba(167,139,250,.25)',
                          background: active ? 'rgba(74,222,128,.10)' : 'rgba(15,10,26,.45)',
                          color: active ? '#4ade80' : 'rgba(196,181,253,.92)',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .15s ease',
                        }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="auth-label">Invite a technician (optional)</label>
                  <input
                    className="auth-input"
                    value={techEmail}
                    onChange={(e) => setTechEmail(e.target.value)}
                    placeholder="tech@yourshop.com"
                    inputMode="email"
                  />
                  <p className="auth-muted" style={{ marginTop: 8, fontSize: 12 }}>
                    We’ll stage the invite now. Full invite emails + permissions are coming next.
                  </p>
                </div>
                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(167,139,250,.18)',
                    background: 'rgba(167,139,250,.06)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Why invite now?</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(196,181,253,.75)', fontSize: 13, lineHeight: 1.7 }}>
                    <li>Tickets can auto-assign faster</li>
                    <li>Clear roles from day one</li>
                    <li>Less “empty dashboard” feeling</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Messaging preferences</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'rgba(196,181,253,.85)', fontWeight: 700, fontSize: 13 }}>Email updates</span>
                      <button
                        type="button"
                        onClick={() => setEmailUpdates((v) => !v)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: '1px solid rgba(167,139,250,.25)',
                          background: emailUpdates ? 'rgba(74,222,128,.10)' : 'rgba(15,10,26,.45)',
                          color: emailUpdates ? '#4ade80' : 'rgba(196,181,253,.75)',
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {emailUpdates ? 'Enabled' : 'Disabled'}
                      </button>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'rgba(196,181,253,.85)', fontWeight: 700, fontSize: 13 }}>SMS updates</span>
                      <button
                        type="button"
                        onClick={() => setSmsUpdates((v) => !v)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: '1px solid rgba(167,139,250,.25)',
                          background: smsUpdates ? 'rgba(74,222,128,.10)' : 'rgba(15,10,26,.45)',
                          color: smsUpdates ? '#4ade80' : 'rgba(196,181,253,.75)',
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {smsUpdates ? 'Enabled' : 'Disabled'}
                      </button>
                    </label>

                    <div style={{ marginTop: 6, color: 'rgba(196,181,253,.65)', fontSize: 12, lineHeight: 1.6 }}>
                      We’ll respect your hours so customers don’t get texts at 2am.
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Business hours</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dayOrder.map((d) => {
                      const day = businessHours[d] || {}
                      const closed = !!day.closed
                      return (
                        <div
                          key={d}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '54px 1fr 1fr 92px',
                            gap: 10,
                            alignItems: 'center',
                            padding: '10px 12px',
                            borderRadius: 14,
                            background: 'rgba(15,10,26,.45)',
                            border: '1px solid rgba(167,139,250,.16)',
                          }}
                        >
                          <div style={{ color: 'rgba(196,181,253,.85)', fontWeight: 800, fontSize: 12 }}>{d}</div>
                          <input
                            type="time"
                            className="auth-input"
                            value={day.open || '09:00'}
                            disabled={closed}
                            onChange={(e) =>
                              setBusinessHours((prev) => ({ ...prev, [d]: { ...prev[d], open: e.target.value } }))
                            }
                            style={{ height: 40 }}
                          />
                          <input
                            type="time"
                            className="auth-input"
                            value={day.close || '18:00'}
                            disabled={closed}
                            onChange={(e) =>
                              setBusinessHours((prev) => ({ ...prev, [d]: { ...prev[d], close: e.target.value } }))
                            }
                            style={{ height: 40 }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setBusinessHours((prev) => ({
                                ...prev,
                                [d]: { ...prev[d], closed: !closed },
                              }))
                            }
                            style={{
                              height: 40,
                              borderRadius: 12,
                              border: '1px solid rgba(167,139,250,.22)',
                              background: closed ? 'rgba(239,68,68,.10)' : 'rgba(74,222,128,.10)',
                              color: closed ? 'rgba(239,68,68,.95)' : '#4ade80',
                              fontWeight: 900,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            {closed ? 'Closed' : 'Open'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
                    ✅ {shopName.trim() ? shopName.trim() : 'Your shop'} is ready
                  </div>
                  <div style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, fontSize: 13 }}>
                    You’ll land in a dashboard that already looks alive — personalized with your shop name, location, and
                    repair focus.
                  </div>

                  <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                    {[
                      '✅ Ticketing ready',
                      '✅ Inventory forecasting enabled',
                      '✅ Customer updates template loaded',
                      '🟣 Insurance-ready paperwork templates (coming soon)',
                    ].map((t) => (
                      <div
                        key={t}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 14,
                          border: '1px solid rgba(167,139,250,.18)',
                          background: 'rgba(15,10,26,.45)',
                          color: 'rgba(196,181,253,.92)',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(167,139,250,.20)',
                    background: 'rgba(167,139,250,.06)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 8 }}>System status</div>
                  <div style={{ color: 'rgba(196,181,253,.75)', fontSize: 12, lineHeight: 1.6 }}>
                    Configured for repair shops • Prebuilt templates loaded • Best-practice workflows included
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(196,181,253,.9)', marginBottom: 8 }}>
                      Supplier integrations supported
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {supplierBadges.map((b) => (
                        <span
                          key={b}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 999,
                            border: '1px solid rgba(167,139,250,.22)',
                            background: 'rgba(15,10,26,.35)',
                            color: 'rgba(196,181,253,.9)',
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 14,
                  background: 'rgba(239,68,68,.10)',
                  border: '1px solid rgba(239,68,68,.25)',
                  color: 'rgba(239,68,68,.95)',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 22 }}>
              <button
                type="button"
                onClick={handleBack}
                disabled={saving || step === 1}
                className="glow-button glow-button-secondary"
                style={{ padding: '14px 18px', opacity: step === 1 ? 0.5 : 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="glow-button"
                style={{ padding: '14px 18px', minWidth: 220 }}
              >
                {saving ? 'Saving…' : step === 5 ? 'Go to Dashboard →' : 'Save & continue →'}
              </button>
            </div>

            <div style={{ marginTop: 14, textAlign: 'center', color: 'rgba(196,181,253,.55)', fontSize: 12, lineHeight: 1.6 }}>
              You can change any of this later in Settings. We’re just making the dashboard feel ready.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



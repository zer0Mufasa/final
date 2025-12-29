'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/ui/page-header'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Skeleton } from '@/components/dashboard/ui/skeleton'
import { Tabs } from '@/components/dashboard/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bell, CreditCard, FileText, Lock, Settings as SettingsIcon, Users } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useActor, type StaffMember, type StaffRole, type StaffStatus } from '@/contexts/actor-context'
import { useRole } from '@/contexts/role-context'
import { StateBanner } from '@/components/dashboard/ui/state-banner'
import { Modal } from '@/components/dashboard/ui/modal'

const tabDefs = [
  { value: 'shop', label: 'Shop' },
  { value: 'team', label: 'Team' },
  { value: 'billing', label: 'Billing' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'templates', label: 'Templates' },
  { value: 'security', label: 'Security' },
]

export function SettingsClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const [loading, setLoading] = useState(true)
  const tab = sp.get('tab') || 'shop'
  const { actor, staff, setStaff } = useActor()
  const { canManageSettings } = useRole()

  const [manageOpen, setManageOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftRole, setDraftRole] = useState<StaffRole>('TECHNICIAN')
  const [draftPin, setDraftPin] = useState('')
  const [draftStatus, setDraftStatus] = useState<StaffStatus>('ACTIVE')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  const setTab = (v: string) => {
    router.replace(`/settings?tab=${encodeURIComponent(v)}`)
  }

  const normalizePin = (pin: string) => (pin || '').replace(/\D/g, '').slice(0, 6)

  const openManage = (m: StaffMember) => {
    setEditingId(m.id)
    setDraftName(m.name)
    setDraftRole(m.role)
    setDraftPin(m.pin6)
    setDraftStatus(m.status)
    setManageOpen(true)
  }

  const openAdd = (role: StaffRole) => {
    setEditingId(null)
    setDraftName('')
    setDraftRole(role)
    setDraftPin('')
    setDraftStatus('ACTIVE')
    setAddOpen(true)
  }

  const saveEdit = () => {
    if (!editingId) return
    const pin6 = normalizePin(draftPin)
    if (pin6.length !== 6) return
    setStaff(
      staff.map((m) =>
        m.id === editingId
          ? { ...m, name: draftName.trim() || m.name, role: draftRole, pin6, status: draftStatus }
          : m
      )
    )
    setManageOpen(false)
  }

  const removeMember = () => {
    if (!editingId) return
    if (editingId === 'owner') return
    setStaff(staff.filter((m) => m.id !== editingId))
    setManageOpen(false)
  }

  const addMember = () => {
    const pin6 = normalizePin(draftPin)
    if (!draftName.trim() || pin6.length !== 6) return
    const id = `${draftRole.toLowerCase()}_${draftName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Math.random().toString(16).slice(2, 6)}`
    setStaff([
      ...staff,
      {
        id,
        name: draftName.trim(),
        role: draftRole,
        pin6,
        status: draftStatus,
      },
    ])
    setAddOpen(false)
  }

  const perfFor = (id: string) => {
    // Deterministic UI-only metrics from id
    const n = Array.from(id).reduce((sum, c) => sum + c.charCodeAt(0), 0)
    const tickets = 8 + (n % 27)
    const avgHrs = 2 + ((n % 17) / 3)
    const rework = Math.min(12, 2 + (n % 9))
    const csat = 4.2 + ((n % 7) / 10)
    return { tickets, avgHrs: avgHrs.toFixed(1), rework, csat: csat.toFixed(1) }
  }

  const content = (() => {
    if (loading) return null
    switch (tab) {
      case 'team':
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Users className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Team members
              </div>
              <div className="mt-3">
                {!canManageSettings ? (
                  <StateBanner
                    type="locked"
                    message="Owner mode required to manage staff, change PINs, or access controls."
                    action={{ label: 'Switch to Owner', onClick: () => router.push('/settings?tab=team') }}
                  />
                ) : null}
              </div>

              <div className="mt-4 space-y-2">
                {staff
                  .slice()
                  .sort((a, b) => (a.role === 'OWNER' ? -1 : b.role === 'OWNER' ? 1 : a.name.localeCompare(b.name)))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/85 truncate">{m.name}</div>
                        <div className="text-xs text-white/45 mt-0.5">
                          {m.role === 'FRONT_DESK' ? 'Front Desk' : m.role === 'TECHNICIAN' ? 'Technician' : 'Owner'}
                          {actor.id === m.id ? <span className="text-purple-300 font-semibold"> • current</span> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'badge',
                            m.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-300'
                              : m.status === 'OFF'
                                ? 'bg-white/5 text-white/55 border border-white/10'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-400/20'
                          )}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                        <button
                          className="btn-secondary px-3 py-2 rounded-xl text-xs disabled:opacity-50"
                          disabled={!canManageSettings}
                          onClick={() => openManage(m)}
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {canManageSettings ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button className="btn-primary px-4 py-3 rounded-xl" onClick={() => openAdd('TECHNICIAN')}>
                    Add technician
                  </button>
                  <button className="btn-secondary px-4 py-3 rounded-xl" onClick={() => openAdd('FRONT_DESK')}>
                    Add front desk
                  </button>
                </div>
              ) : null}
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Roles & permissions</div>
              <div className="mt-2 text-sm text-white/55 leading-relaxed">
                Keep front desk fast and technicians focused. Fine-grained permissions will be wired later.
              </div>
              <div className="mt-4 space-y-2">
                {['Owner: billing + settings', 'Manager: tickets + customers', 'Technician: repairs + notes'].map((x) => (
                  <div key={x} className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white/75">
                    {x}
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl lg:col-span-3">
              <div className="text-sm font-semibold text-white/90">Performance snapshot</div>
              <div className="text-xs text-white/50 mt-1">
                UI-only — shows what an owner would see: workload, quality, and customer sentiment.
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {staff
                  .filter((m) => m.role !== 'OWNER')
                  .map((m) => {
                    const p = perfFor(m.id)
                    return (
                      <div key={m.id} className="rounded-3xl bg-white/[0.03] border border-white/10 p-5">
                        <div className="text-sm font-semibold text-white/90">{m.name}</div>
                        <div className="text-xs text-white/45 mt-0.5">
                          {m.role === 'TECHNICIAN' ? 'Technician' : 'Front Desk'}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3">
                            <div className="text-white/45 uppercase tracking-wider font-semibold">Tickets</div>
                            <div className="text-white/85 font-bold mt-1">{p.tickets}</div>
                          </div>
                          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3">
                            <div className="text-white/45 uppercase tracking-wider font-semibold">Avg time</div>
                            <div className="text-white/85 font-bold mt-1">{p.avgHrs}h</div>
                          </div>
                          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3">
                            <div className="text-white/45 uppercase tracking-wider font-semibold">Rework</div>
                            <div className="text-white/85 font-bold mt-1">{p.rework}%</div>
                          </div>
                          <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3">
                            <div className="text-white/45 uppercase tracking-wider font-semibold">CSAT</div>
                            <div className="text-white/85 font-bold mt-1">{p.csat}/5</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </GlassCard>
          </div>
        )
      case 'billing':
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white/90">Plan & billing</div>
                  <div className="text-xs text-white/50 mt-0.5">Designed to match your Pricing vibe (inside dashboard).</div>
                </div>
                <span className="badge bg-white/5 text-white/55 border border-white/10">UI only</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { name: 'Starter', price: '$99', hint: '14-day trial', active: false },
                  { name: 'Professional', price: '$249', hint: '30-day warranty', active: true },
                  { name: 'Custom', price: '?', hint: 'Contact sales', active: false },
                ].map((p) => (
                  <div key={p.name} className={cn('rounded-3xl border p-5', p.active ? 'bg-purple-500/[0.08] border-purple-400/25' : 'bg-white/[0.03] border-white/10')}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white/90">{p.name}</div>
                        <div className="text-xs text-white/50 mt-0.5">{p.hint}</div>
                      </div>
                      {p.active ? <span className="badge bg-green-500/20 text-green-300">Current</span> : null}
                    </div>
                    <div className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                      {p.price}
                      {p.price.startsWith('$') ? <span className="text-sm font-semibold text-white/45">/mo</span> : null}
                    </div>
                    <button className={cn('mt-4 w-full px-4 py-3 rounded-xl text-sm font-semibold', p.active ? 'btn-secondary' : p.name === 'Custom' ? 'btn-secondary' : 'btn-primary')}>
                      {p.active ? 'Manage billing' : p.name === 'Custom' ? 'Contact sales' : 'Upgrade (UI)'}
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <CreditCard className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Payment method
              </div>
              <div className="mt-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="text-sm font-semibold text-white/85">Visa •••• 4242</div>
                <div className="text-xs text-white/45 mt-1">Expires 12/28</div>
              </div>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-3">Update card (UI)</button>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-2">View invoices (UI)</button>
            </GlassCard>
          </div>
        )
      case 'notifications':
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Bell className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Notifications
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { t: 'Past promised time', d: 'Alert when a ticket is overdue.' },
                  { t: 'Low stock', d: 'Notify when a part hits minimums.' },
                  { t: 'Customer replies', d: 'Show replies in messages inbox.' },
                  { t: 'Daily summary', d: 'One recap in the morning.' },
                ].map((n, i) => (
                  <label key={n.t} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-white/85">{n.t}</div>
                      <div className="text-xs text-white/45 mt-0.5">{n.d}</div>
                    </div>
                    <input type="checkbox" defaultChecked={i < 2} className="accent-[#a78bfa]" />
                  </label>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Channels</div>
              <div className="mt-4 space-y-2">
                {['In-app', 'Email', 'SMS (later)'].map((x, i) => (
                  <label key={x} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer">
                    <span className="text-sm text-white/80">{x}</span>
                    <input type="checkbox" defaultChecked={i < 2} className="accent-[#a78bfa]" />
                  </label>
                ))}
              </div>
            </GlassCard>
          </div>
        )
      case 'templates':
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <FileText className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Message templates (UI)
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  { name: 'Intake received', text: 'We received your device and started diagnostics. Next update soon.' },
                  { name: 'Estimate ready', text: 'Your estimate is ready. Reply YES to approve and we’ll proceed.' },
                  { name: 'Ready for pickup', text: 'Good news — your repair is complete and ready for pickup.' },
                ].map((t) => (
                  <div key={t.name} className="rounded-3xl bg-white/[0.03] border border-white/10 p-5">
                    <div className="text-sm font-semibold text-white/85">{t.name}</div>
                    <div className="mt-2 text-sm text-white/65 leading-relaxed">{t.text}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <button className="btn-secondary px-4 py-2 rounded-xl text-sm">Edit</button>
                      <button className="btn-secondary px-4 py-2 rounded-xl text-sm">Duplicate</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Tone</div>
              <div className="mt-2 text-sm text-white/55 leading-relaxed">
                Fixology templates are short, calm, and confident — designed for busy customers.
              </div>
              <button className="btn-primary px-4 py-3 rounded-xl w-full mt-4">Create template</button>
            </GlassCard>
          </div>
        )
      case 'security':
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Lock className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Security
              </div>
              {!canManageSettings ? (
                <div className="mt-4">
                  <StateBanner
                    type="locked"
                    message="Owner mode required to change staff PINs or access security controls."
                  />
                </div>
              ) : null}
              <div className="mt-4 space-y-2">
                {[
                  { t: 'Require strong passwords', d: 'Minimum length and complexity checks.' },
                  { t: 'Session timeout', d: 'Auto-log out after inactivity.' },
                  { t: '2FA (later)', d: 'Enable two-factor authentication.' },
                ].map((n, i) => (
                  <label key={n.t} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-white/85">{n.t}</div>
                      <div className="text-xs text-white/45 mt-0.5">{n.d}</div>
                    </div>
                    <input type="checkbox" defaultChecked={i === 0} className="accent-[#a78bfa]" />
                  </label>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Password</div>
              <div className="mt-2 text-xs text-white/50">UI only — wire later.</div>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-4">Change password</button>
              <button className="btn-secondary px-4 py-3 rounded-xl w-full mt-2">View login activity</button>
            </GlassCard>
          </div>
        )
      default:
        return (
          <div className="grid gap-4 lg:grid-cols-3">
            <GlassCard className="rounded-3xl lg:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <SettingsIcon className="w-4 h-4 text-purple-300" aria-hidden="true" />
                Shop
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Shop name</label>
                  <input className="input bg-white/[0.04] border-white/10" defaultValue="Demo Shop" />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="select bg-white/[0.04] border-white/10" defaultValue="America/Chicago">
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input bg-white/[0.04] border-white/10" defaultValue="(512) 555-0100" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input bg-white/[0.04] border-white/10" defaultValue="shop@fixology.local" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input className="input bg-white/[0.04] border-white/10" defaultValue="123 Repair Lane, Austin, TX" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn-secondary px-4 py-3 rounded-xl">Cancel</button>
                <button className="btn-primary px-4 py-3 rounded-xl">Save changes (UI)</button>
              </div>
            </GlassCard>

            <GlassCard className="rounded-3xl">
              <div className="text-sm font-semibold text-white/90">Defaults</div>
              <div className="mt-4 space-y-2">
                {['Require waiver on intake', 'Auto-set promised time to 4h', 'Notify on low stock'].map((x, i) => (
                  <label key={x} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3 cursor-pointer">
                    <span className="text-sm text-white/80">{x}</span>
                    <input type="checkbox" defaultChecked={i < 2} className="accent-[#a78bfa]" />
                  </label>
                ))}
              </div>
            </GlassCard>
          </div>
        )
    }
  })()

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your workspace: shop details, team, billing, notifications, templates, and security."
        action={
          <Button rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />} variant="secondary">
            Save all (UI)
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} tabs={tabDefs} className="mb-4" />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[380px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-[380px] rounded-3xl" />
        </div>
      ) : (
        content
      )}

      {/* Manage member modal (owner-only) */}
      <Modal
        open={manageOpen}
        onOpenChange={setManageOpen}
        title="Manage staff member"
        description="Owner controls • UI-only for now."
      >
        {!canManageSettings ? (
          <StateBanner type="locked" message="Owner mode required." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Name</label>
                <input
                  className="input bg-white/[0.04] border-white/10"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="select bg-white/[0.04] border-white/10"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value as any)}
                >
                  <option value="TECHNICIAN">Technician</option>
                  <option value="FRONT_DESK">Front Desk</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="select bg-white/[0.04] border-white/10"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OFF">Off</option>
                  <option value="ON_LEAVE">On leave</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">6-digit PIN</label>
                <input
                  className="input bg-white/[0.04] border-white/10 tracking-[0.45em] text-center font-semibold"
                  value={draftPin}
                  onChange={(e) => setDraftPin(normalizePin(e.target.value))}
                  placeholder="••••••"
                  inputMode="numeric"
                />
                <div className="text-xs text-white/45 mt-2">Each technician and owner has their own 6-digit PIN.</div>
              </div>
            </div>

            {normalizePin(draftPin).length !== 6 ? (
              <StateBanner type="outdated" message="PIN must be exactly 6 digits." />
            ) : null}

            <div className="flex items-center gap-2">
              <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={() => setManageOpen(false)}>
                Close
              </button>
              <button
                className="btn-primary px-4 py-3 rounded-xl flex-1 disabled:opacity-50"
                disabled={!draftName.trim() || normalizePin(draftPin).length !== 6}
                onClick={saveEdit}
              >
                Save changes
              </button>
            </div>

            {editingId && editingId !== 'owner' ? (
              <button
                className="btn-secondary px-4 py-3 rounded-xl w-full border border-red-500/30 text-red-200 hover:bg-red-500/10"
                onClick={removeMember}
              >
                Remove employee
              </button>
            ) : (
              <div className="text-xs text-white/45">Owner account cannot be removed.</div>
            )}
          </div>
        )}
      </Modal>

      {/* Add member modal (owner-only) */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add employee"
        description="Create a tech or front desk profile with a 6-digit PIN (UI-only)."
      >
        {!canManageSettings ? (
          <StateBanner type="locked" message="Owner mode required." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Name</label>
                <input
                  className="input bg-white/[0.04] border-white/10"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="e.g., Sam"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="select bg-white/[0.04] border-white/10"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value as any)}
                >
                  <option value="TECHNICIAN">Technician</option>
                  <option value="FRONT_DESK">Front Desk</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="select bg-white/[0.04] border-white/10"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="OFF">Off</option>
                  <option value="ON_LEAVE">On leave</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">6-digit PIN</label>
                <input
                  className="input bg-white/[0.04] border-white/10 tracking-[0.45em] text-center font-semibold"
                  value={draftPin}
                  onChange={(e) => setDraftPin(normalizePin(e.target.value))}
                  placeholder="••••••"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn-secondary px-4 py-3 rounded-xl flex-1" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary px-4 py-3 rounded-xl flex-1 disabled:opacity-50"
                disabled={!draftName.trim() || normalizePin(draftPin).length !== 6}
                onClick={addMember}
              >
                Add employee
              </button>
            </div>

            <div className="text-xs text-white/45">
              Design note: this is UI-only. Later we’ll enforce PINs server-side and add audit logs.
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}



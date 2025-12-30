'use client'

// components/dashboard/topbar.tsx
// Global dashboard top bar (UI-only): search, "New" dropdown, notifications, user menu

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { CommandPalette } from './command-palette'
import { Modal } from '@/components/dashboard/ui/modal'
import { StateBanner } from '@/components/dashboard/ui/state-banner'
import { useActor } from '@/contexts/actor-context'
import { ButtonPrimary, ButtonSecondary } from '@/components/ui/buttons'
import { theme } from '@/lib/theme/tokens'
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Ticket,
  UserPlus,
  PackagePlus,
  Stethoscope,
  User,
  Building2,
  Settings,
  Monitor,
  Wrench,
  Crown,
} from 'lucide-react'

type TopBarProps = {
  user?: { name: string; email: string; role: string }
  shop?: { name: string; plan: string; city?: string; state?: string }
}

function initials(name?: string) {
  const n = (name || 'User').trim()
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || 'U'
  const b = parts[1]?.[0] || ''
  return (a + b).toUpperCase()
}

export function TopBar({ user, shop }: TopBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { actor, staff, verifyPin, setActiveActor } = useActor()

  const [switchOpen, setSwitchOpen] = useState(false)
  const [switchTarget, setSwitchTarget] = useState<'TECHNICIAN' | 'FRONT_DESK'>('TECHNICIAN')
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const pinRef = useRef<HTMLInputElement | null>(null)

  const owner = useMemo(() => staff.find((m) => m.role === 'OWNER') || staff[0], [staff])
  const techs = useMemo(() => staff.filter((m) => m.role === 'TECHNICIAN'), [staff])
  const frontDesk = useMemo(() => staff.filter((m) => m.role === 'FRONT_DESK'), [staff])

  const openTechSwitch = () => {
    setSwitchTarget('TECHNICIAN')
    setSwitchOpen(true)
  }
  const openFrontDeskSwitch = () => {
    setSwitchTarget('FRONT_DESK')
    setSwitchOpen(true)
  }
  const openOwnerPin = () => {
    setPendingId(owner?.id || 'owner')
    setPinError(null)
    setPinOpen(true)
    setTimeout(() => pinRef.current?.focus(), 50)
  }

  const beginPinFor = (id: string) => {
    setPendingId(id)
    setPinError(null)
    setPinOpen(true)
    setTimeout(() => pinRef.current?.focus(), 50)
  }

  const submitPin = () => {
    if (!pendingId) return
    const raw = pinRef.current?.value || ''
    const clean = raw.replace(/\D/g, '').slice(0, 6)
    if (clean.length !== 6) {
      setPinError('Enter the 6-digit PIN.')
      return
    }
    if (!verifyPin(pendingId, clean)) {
      setPinError('Incorrect PIN. Try again.')
      return
    }
    setActiveActor(pendingId)
    setPinOpen(false)
    setSwitchOpen(false)
    setPinError(null)
    if (pinRef.current) pinRef.current.value = ''
  }

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const crumbs = useMemo(() => {
    const seg = pathname.split('?')[0].split('/').filter(Boolean)
    if (seg.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }]
    const primary = seg[0]
    const labelMap: Record<string, string> = {
      dashboard: 'Dashboard',
      tickets: 'Tickets',
      customers: 'Customers',
      inventory: 'Inventory',
      diagnostics: 'Diagnostics',
      invoices: 'Invoices',
      reports: 'Reports',
      settings: 'Settings',
      support: 'Support',
    }
    return [{ label: labelMap[primary] || 'Dashboard', href: `/${primary}` }]
  }, [pathname])

  const handleLogout = async () => {
    // UI-only: clear demo mode if present, then navigate to login.
    try {
      document.cookie = 'fx_demo=; path=/; max-age=0; samesite=lax'
    } catch {}
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-white border-b border-[rgba(30,30,60,0.08)] shadow-[0_10px_30px_rgba(15,16,32,0.06)]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            {/* Left: breadcrumbs + subtle context */}
            <div className="min-w-0 flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#6b7280]">
                {crumbs.map((c) => (
                  <Link key={c.href} href={c.href} className="hover:text-[#111827] transition-colors">
                    {c.label}
                  </Link>
                ))}
              </div>
              {shop?.name ? (
                <div className="hidden md:flex items-center gap-2 text-xs text-[#9ca3af]">
                  <span className="w-1 h-1 rounded-full bg-[#8b5cf6]" aria-hidden="true" />
                  <span className="truncate max-w-[220px]">{shop.name}</span>
                </div>
              ) : null}
            </div>

            {/* Center: search */}
            <div className="flex-1 max-w-[560px]">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className={cn(
                  'w-full relative flex items-center gap-3 px-4 py-2.5 rounded-[10px]',
                  'bg-[#F2F1F8] border border-[rgba(30,30,60,0.08)]',
                  'hover:border-[rgba(139,124,246,0.35)] transition-all',
                  'text-left text-sm text-[#5E5B7A]'
                )}
              >
                <Search className="w-4 h-4 text-[#8C8AA3] flex-shrink-0" aria-hidden="true" />
                <span className="flex-1">Search ticket #, phone, IMEI, device…</span>
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[rgba(30,30,60,0.08)] text-xs text-[#8C8AA3] font-mono">
                  <kbd className="px-1 py-0.5 rounded bg-[#F2F1F8] border border-[rgba(30,30,60,0.08)]">⌘</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-[#F2F1F8] border border-[rgba(30,30,60,0.08)]">K</kbd>
                </kbd>
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div className="hidden lg:flex items-center gap-1 rounded-[12px] bg-[#F2F1F8] border border-[rgba(30,30,60,0.08)] p-1">
                <button
                  onClick={openFrontDeskSwitch}
                  className={cn(
                    'px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all',
                    actor.role === 'FRONT_DESK'
                      ? 'bg-white text-[#1F1E2E]'
                      : 'text-[#5E5B7A] hover:text-[#1F1E2E]'
                  )}
                  title="Front Desk Mode"
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
                  Front Desk
                </button>
                <button
                  onClick={openTechSwitch}
                  className={cn(
                    'px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all',
                    actor.role === 'TECHNICIAN'
                      ? 'bg-white text-[#1F1E2E]'
                      : 'text-[#5E5B7A] hover:text-[#1F1E2E]'
                  )}
                  title="Technician Mode"
                >
                  <Wrench className="w-3.5 h-3.5 inline mr-1.5" />
                  Tech
                </button>
                <button
                  onClick={openOwnerPin}
                  className={cn(
                    'px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-all',
                    actor.role === 'OWNER'
                      ? 'bg-white text-[#1F1E2E]'
                      : 'text-[#5E5B7A] hover:text-[#1F1E2E]'
                  )}
                  title="Owner Mode"
                >
                  <Crown className="w-3.5 h-3.5 inline mr-1.5" />
                  Owner
                </button>
              </div>

              {/* New dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <ButtonPrimary className="px-4 py-2.5 text-sm rounded-xl inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">New</span>
                    <ChevronDown className="w-4 h-4 opacity-80" aria-hidden="true" />
                  </ButtonPrimary>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className={cn(
                      'z-[60] w-64 p-2 rounded-2xl',
                      'bg-black/70 backdrop-blur-xl border border-white/10',
                      'shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
                    )}
                  >
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/tickets/new')}
                    >
                      <Ticket className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      New Ticket
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/customers/new')}
                    >
                      <UserPlus className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      New Customer
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/inventory?add=1')}
                    >
                      <PackagePlus className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      Add Inventory
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/diagnostics?new=1')}
                    >
                      <Stethoscope className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      Run Diagnostic
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-white/10 my-2" />
                    <div className="px-3 pb-2 pt-1 text-xs text-white/45">
                      Actions are UI-only for now.
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* Notifications */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <ButtonSecondary className="px-3 py-2.5 rounded-[10px] relative">
                    <Bell className="w-4 h-4" aria-hidden="true" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#8B7CF6] shadow-[0_0_0_3px_rgba(30,30,60,0.12)]" aria-hidden="true" />
                  </ButtonSecondary>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className={cn(
                      'z-[60] w-[340px] p-2 rounded-2xl',
                      'bg-black/70 backdrop-blur-xl border border-white/10',
                      'shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
                    )}
                  >
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/45">
                      Notifications
                    </div>
                    {[
                      { title: '2 tickets are past promised time', desc: 'Review the “Ready” column to prevent delays.' },
                      { title: 'Low stock: iPhone 14 Pro screen', desc: 'Reorder suggestion is ready (UI only).' },
                      { title: 'Customer reply received', desc: '“Can you confirm the price?” (mock).' },
                    ].map((n) => (
                      <div key={n.title} className="rounded-xl px-3 py-2.5 hover:bg-white/10 transition-colors">
                        <div className="text-sm font-semibold text-white/85">{n.title}</div>
                        <div className="text-xs text-white/55 mt-1 leading-relaxed">{n.desc}</div>
                      </div>
                    ))}
                    <DropdownMenu.Separator className="h-px bg-white/10 my-2" />
                    <div className="px-3 pb-2 pt-1 text-xs text-white/45">
                      UI only — will wire realtime later.
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* User menu */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <ButtonSecondary className="px-3 py-2.5 rounded-[10px] inline-flex items-center gap-2">
                    <span className="w-8 h-8 rounded-[10px] bg-[#8B7CF6] text-white flex items-center justify-center text-sm font-semibold">
                      {initials(actor?.name || user?.name)}
                    </span>
                    <div className="hidden lg:flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold text-[#1F1E2E] max-w-[160px] truncate">
                        {actor?.name || user?.name || 'Demo User'}
                      </span>
                      <span className="text-xs text-[#5E5B7A]">
                        {actor?.role || user?.role || 'Owner'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#8C8AA3] hidden lg:block" aria-hidden="true" />
                  </ButtonSecondary>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className={cn(
                      'z-[60] w-72 p-2 rounded-2xl',
                      'bg-black/70 backdrop-blur-xl border border-white/10',
                      'shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
                    )}
                  >
                    <div className="px-3 py-2">
                      <div className="text-sm font-semibold text-white/90">{user?.name || 'Demo User'}</div>
                      <div className="text-xs text-white/50 mt-0.5">{user?.email || 'demo@fixology.local'}</div>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-white/10 my-2" />

                    {/* Role badge */}
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-400/30">
                          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                            {actor?.role || user?.role || 'Owner'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-white/10 my-2" />
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/settings?tab=profile')}
                    >
                      <User className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      Profile
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/settings?tab=shop')}
                    >
                      <Building2 className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      Workspace
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={() => router.push('/settings')}
                    >
                      <Settings className="w-4 h-4 text-purple-300" aria-hidden="true" />
                      Settings
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-white/10 my-2" />

                    <DropdownMenu.Item
                      className="outline-none cursor-pointer rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                      onSelect={handleLogout}
                    >
                      <LogOut className="w-4 h-4 text-white/60" aria-hidden="true" />
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Switch: pick staff member */}
      <Modal
        open={switchOpen}
        onOpenChange={setSwitchOpen}
        title={switchTarget === 'TECHNICIAN' ? 'Select technician' : 'Select front desk'}
        description="UI-only identity switch. Pick your name to keep actions accountable."
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            {(switchTarget === 'TECHNICIAN' ? techs : frontDesk).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  // Front desk: no PIN (speed). Tech: require PIN.
                  if (m.role === 'TECHNICIAN') {
                    beginPinFor(m.id)
                  } else {
                    setActiveActor(m.id)
                    setSwitchOpen(false)
                  }
                }}
                className={cn(
                  'w-full text-left rounded-2xl border px-4 py-3 transition-colors',
                  'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]',
                  actor.id === m.id && 'bg-purple-500/10 border-purple-400/30'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/90">{m.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">{m.role.replace('_', ' ')}</div>
                  </div>
                  <div className="text-xs text-white/45">
                    {m.role === 'TECHNICIAN' ? 'PIN required' : 'Fast switch'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-white/45">
            Tip: tech mode uses a 6‑digit PIN per person. Owner mode is always PIN‑gated.
          </div>
        </div>
      </Modal>

      {/* PIN modal */}
      <Modal
        open={pinOpen}
        onOpenChange={(o) => {
          setPinOpen(o)
          if (!o) {
            setPinError(null)
            setPendingId(null)
            if (pinRef.current) pinRef.current.value = ''
          }
        }}
        title="Enter PIN"
        description="6-digit PIN for this user (UI-only)."
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <div className="text-xs text-white/50">Signing in as</div>
            <div className="text-sm font-semibold text-white/90 mt-1">
              {staff.find((s) => s.id === pendingId)?.name || 'User'}
            </div>
          </div>

          <div>
            <label className="label">6-digit PIN</label>
            <input
              ref={pinRef}
              onChange={() => setPinError(null)}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="input bg-white/[0.04] border-white/10 tracking-[0.45em] text-center text-lg font-semibold"
              placeholder="••••••"
            />
          </div>

          {pinError ? <StateBanner type="outdated" message={pinError} /> : null}

          <div className="flex items-center gap-2">
            <ButtonSecondary className="px-4 py-3 rounded-xl flex-1" onClick={() => setPinOpen(false)}>
              Cancel
            </ButtonSecondary>
            <button className="btn-primary px-4 py-3 rounded-xl flex-1" onClick={submitPin}>
              Unlock
            </button>
          </div>

          <div className="text-xs text-white/45">
            Design note: PINs are stored locally for this demo. Backend enforcement comes later.
          </div>
        </div>
      </Modal>
    </header>
  )
}



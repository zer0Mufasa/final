'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  LogIn,
  LogOut,
  Sparkles,
  Play,
  Square,
  Clock,
  Zap,
  Target,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useActor } from '@/contexts/actor-context'

// ============================================
// FIXOLOGY DASHBOARD v3.0 - ENHANCED AESTHETICS
// Dynamic data, animations, hover effects, and new widgets
// ============================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// MOCK DATA
// ============================================

const UPDATES = [
  {
    id: 1,
    emoji: '🚀',
    title: 'AI Diagnostics is Live!',
    date: 'Dec 30',
    badge: 'New',
    badgeColor: 'violet',
    preview: 'Diagnose device issues 3x faster with AI-powered analysis.',
    link: '/features/ai-diagnostics',
  },
  {
    id: 2,
    emoji: '🎁',
    title: 'Early Adopter Bonus',
    date: 'Dec 30',
    badge: 'Limited',
    badgeColor: 'fuchsia',
    preview: 'Run 10 diagnostics this week → Get 3 months Pro FREE.',
  },
  {
    id: 3,
    emoji: '📦',
    title: 'Smart Inventory Predictions',
    date: 'Dec 28',
    preview: 'AI now predicts when you\'ll run low on parts.',
  },
  {
    id: 4,
    emoji: '🎓',
    title: 'Live Training: Jan 2nd',
    date: 'Dec 26',
    preview: 'Join us at 2PM EST to master AI diagnostics.',
  },
  {
    id: 5,
    emoji: '💳',
    title: 'Square Terminal Ready',
    date: 'Dec 22',
    preview: 'Accept tap, dip, and swipe payments seamlessly.',
  },
]

const QUICK_ACTIONS = [
  { emoji: '🎫', label: 'New Ticket', shortcut: 'N', href: '/tickets/new' },
  { emoji: '👤', label: 'Add Customer', shortcut: 'C', href: '/customers/new' },
  { emoji: '📦', label: 'Check Inventory', shortcut: 'I', href: '/inventory' },
  { emoji: '🔍', label: 'IMEI', shortcut: 'M', href: '/imei' },
]

const TEAM_MEMBERS = [
  { id: 1, name: 'Marcus', role: 'Technician', avatar: '👨‍🔧', status: 'working', currentTask: 'iPhone 14 Pro Screen', taskId: '#1051' },
  { id: 2, name: 'Sarah', role: 'Front Desk', avatar: '👩‍💼', status: 'available', currentTask: null, taskId: null },
  { id: 3, name: 'Alex', role: 'Technician', avatar: '🧑‍🔧', status: 'break', currentTask: null, taskId: null },
  { id: 4, name: 'Jordan', role: 'Technician', avatar: '👨‍💻', status: 'working', currentTask: 'Galaxy S23 Battery', taskId: '#1049' },
]

const UPCOMING_REPAIRS = [
  { id: 1, time: '11:30 AM', customer: 'John D.', device: 'iPhone 14 Pro', issue: 'Screen', status: 'confirmed' },
  { id: 2, time: '1:00 PM', customer: 'Maria S.', device: 'MacBook Air', issue: 'Battery', status: 'confirmed' },
  { id: 3, time: '2:30 PM', customer: 'David L.', device: 'iPad Pro', issue: 'Charging', status: 'pending' },
  { id: 4, time: '4:00 PM', customer: 'Emily R.', device: 'Galaxy S23', issue: 'Screen', status: 'confirmed' },
]

const LOW_STOCK_ALERTS = [
  { part: 'iPhone 14 Pro Screen', qty: 2, reorderPoint: 5 },
  { part: 'Galaxy S23 Battery', qty: 1, reorderPoint: 3 },
  { part: 'USB-C Charging Port', qty: 3, reorderPoint: 10 },
]

// Revenue data for mini chart (last 7 days)
const REVENUE_DATA = [420, 580, 340, 720, 650, 890, 847]

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const router = useRouter()
  const { actor } = useActor()
  const [clockedIn, setClockedIn] = useState(false)
  const [clockTime, setClockTime] = useState<string>('')
  const [shopOpen, setShopOpen] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<number | null>(1)
  const [intakeText, setIntakeText] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  // Animation stagger delay
  const [animationReady, setAnimationReady] = useState(false)

  const apiJson = async <T,>(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<T> => {
    const res = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && 'error' in data && (data as any).error) ||
        `Request failed (${res.status})`
      throw new Error(String(msg))
    }
    return data as T
  }

  useEffect(() => {
    setMounted(true)
    // Stagger animation start
    const timer = setTimeout(() => setAnimationReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Hydrate dashboard toggles from backend (real API calls)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const prefs = await apiJson<{ preferences: any }>('/api/me/preferences')
        if (cancelled) return
        const nextShopOpen = !!prefs?.preferences?.shopOpen
        setShopOpen(nextShopOpen)
      } catch {
        // silent; demo/unauth will still render
      }

      try {
        const clock = await apiJson<{ clockedIn: boolean; entry?: { clockIn?: string } }>(
          '/api/time-entries/clock'
        )
        if (cancelled) return
        setClockedIn(!!clock.clockedIn)
        if (clock.clockedIn && clock.entry?.clockIn) {
          const d = new Date(clock.entry.clockIn)
          setClockTime(
            d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          )
        }
      } catch {
        // silent
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Dynamic greeting based on time
  const greeting = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [currentTime])

  // Format date
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }, [currentTime])

  // Format time
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }, [currentTime])

  const userName = actor?.name?.split(' ')[0] || 'there'

  const templates = [
    'iPhone 14 screen repair for John, $199',
    'Samsung S23 Ultra battery replacement for Maya, $149',
    'iPad Air charging port repair for Chris, $179',
  ]

  const intakePreview = useMemo(() => {
    const text = intakeText.trim()
    if (!text) return { device: '—', customer: '—', issue: '—', price: '—' }

    const lower = text.toLowerCase()

    const priceMatch =
      text.match(/\$\s*(\d+(?:\.\d{1,2})?)/) ||
      text.match(/\b(\d+(?:\.\d{1,2})?)\s*(?:usd|dollars?)\b/i)
    const price = priceMatch ? `$${Number(priceMatch[1]).toFixed(0)}` : '—'

    const customerMatch = text.match(/\b(?:for|customer)\s+([a-z]+(?:\s+[a-z]+)?)/i)
    const customer = customerMatch
      ? customerMatch[1]
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : '—'

    const deviceMatch = text.match(
      /\b(iPhone\s*\d+\s*(?:Pro Max|Pro|Plus|Mini)?|iPad\s*(?:Air|Pro|Mini)?|Pixel\s*\d+\s*(?:Pro|a)?|Galaxy\s*S\d+\s*(?:Ultra|Plus)?|Samsung\s*S\d+\s*(?:Ultra|Plus)?|MacBook\s*(?:Air|Pro)?|Nintendo\s*Switch)\b/i
    )
    const device = deviceMatch ? deviceMatch[1].replace(/\s+/g, ' ').trim() : '—'

    let issue = '—'
    if (lower.includes('screen')) issue = 'Screen'
    else if (lower.includes('battery')) issue = 'Battery'
    else if (lower.includes('charging port') || lower.includes('charge port')) issue = 'Charging Port'
    else if (lower.includes('camera')) issue = 'Camera'
    else if (lower.includes('back glass')) issue = 'Back Glass'
    else if (lower.includes('water')) issue = 'Water Damage'
    else if (lower.includes('speaker')) issue = 'Speaker'

    return { device, customer, issue, price }
  }, [intakeText])

  const handleClockIn = () => {
    const now = new Date()
    setClockTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    setClockedIn(true)
  }

  const handleToggleShop = async () => {
    const next = !shopOpen
    setShopOpen(next)
    try {
      await apiJson('/api/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ shopOpen: next }),
      })
      toast.success(next ? 'Shop marked as open' : 'Shop marked as closed')
    } catch (e: any) {
      setShopOpen(!next)
      toast.error(e?.message || 'Failed to update shop status')
    }
  }

  const handleToggleClock = async () => {
    try {
      const result = await apiJson<{ clockedIn: boolean; entry?: { clockIn?: string; clockOut?: string } }>(
        '/api/time-entries/clock',
        { method: 'POST', body: JSON.stringify({ intent: 'toggle' }) }
      )
      setClockedIn(!!result.clockedIn)
      if (result.clockedIn && result.entry?.clockIn) {
        const d = new Date(result.entry.clockIn)
        setClockTime(d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
        toast.success('Clocked in')
      } else {
        toast.success('Clocked out')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to clock in/out')
    }
  }

  const handleEditGoals = async () => {
    const next = window.prompt('Set today revenue goal (number, USD):', '1500')
    if (!next) return
    const n = Number(next)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Please enter a valid number')
      return
    }
    try {
      await apiJson('/api/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ dailyRevenueGoal: n }),
      })
      toast.success('Goals updated')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save goals')
    }
  }

  const handleViewAllUpdates = () => {
    router.push('/ai-activity')
  }

  const handleCreateFromIntake = async () => {
    const text = intakeText.trim()
    if (!text) {
      toast.error('Enter an intake note first')
      return
    }
    toast.info('Parsing intake…')
    try {
      const ai = await apiJson<{ draft: any }>('/api/tickets/ai-intake', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })

      toast.info('Creating ticket…')
      const created = await apiJson<any>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ draft: ai.draft }),
      })

      toast.success(`Ticket created (${created.ticketNumber || 'new'})`)
      if (created?.id) {
        router.push(`/tickets/${created.id}`)
      } else {
        router.push('/tickets')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create ticket')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return

      const key = e.key.toLowerCase()
      const match = QUICK_ACTIONS.find((a) => a.shortcut.toLowerCase() === key)
      if (!match?.href) return
      router.push(match.href)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  if (!mounted) return null

  return (
    <div className="p-6 space-y-6 animate-page-in">
      {/* Header with Live Clock */}
      <div className={cn(
        "flex items-start justify-between",
        animationReady ? "animate-slide-in-left" : "opacity-0"
      )}>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            <span className="text-gradient">{greeting}</span>, {userName}
            <span className="inline-block ml-2 animate-float">✨</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-white/50">{formattedDate}</p>
            <span
              className="w-1 h-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
              }}
            />
            <p
              className="text-sm font-mono font-medium"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {formattedTime}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={action.label}
              onClick={() => action.href && router.push(action.href)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "transition-all duration-300 ease-out",
                "hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-0.5",
                animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{
                transitionDelay: `${i * 50}ms`,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
              }}
              title={`${action.label} (${action.shortcut})`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-300">{action.emoji}</span>
              <span className="text-sm text-white/60 group-hover:text-white hidden xl:inline transition-colors">{action.label}</span>
              <kbd
                className={cn(
                  "hidden xl:inline text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                  "bg-white/[0.05] text-white/40 border border-white/[0.08]",
                  "group-hover:bg-purple-500/20 group-hover:text-purple-300 group-hover:border-purple-500/30",
                  "transition-all duration-300"
                )}
              >
                {action.shortcut}
              </kbd>
            </button>
          ))}
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Shop Status - Large Card */}
        <div
          className={cn(
            "col-span-12 lg:col-span-4 row-span-2",
            animationReady ? "animate-card-lift" : "opacity-0"
          )}
          style={{ animationDelay: '100ms' }}
        >
          <div
            className="relative h-full rounded-2xl p-6 flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(192, 38, 211, 0.06) 50%, rgba(139, 92, 246, 0.03) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Shop Status</h2>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
                  "transition-all duration-300"
                )}
                style={{
                  background: shopOpen
                    ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: shopOpen
                    ? '1px solid rgba(52, 211, 153, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  color: shopOpen ? '#4ade80' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: shopOpen ? '0 0 15px rgba(52, 211, 153, 0.2)' : 'none',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: shopOpen ? '#4ade80' : 'rgba(255, 255, 255, 0.4)',
                    boxShadow: shopOpen ? '0 0 8px rgba(74, 222, 128, 0.6)' : 'none',
                    animation: shopOpen ? 'pulseGlow 2s ease-in-out infinite' : 'none',
                  }}
                />
                {shopOpen ? 'Open' : 'Closed'}
              </div>
            </div>

            {/* Open/Close Shop */}
            <button
              onClick={handleToggleShop}
              className={cn(
                "relative w-full py-4 rounded-xl font-semibold text-sm overflow-hidden",
                "transition-all duration-300 flex items-center justify-center gap-2",
                "hover:-translate-y-0.5 active:translate-y-0"
              )}
              style={{
                background: shopOpen
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)'
                  : 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.08) 100%)',
                border: shopOpen
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : '1px solid rgba(52, 211, 153, 0.25)',
                color: shopOpen ? '#f87171' : '#4ade80',
                boxShadow: shopOpen
                  ? '0 8px 20px rgba(239, 68, 68, 0.1)'
                  : '0 8px 20px rgba(52, 211, 153, 0.1)',
              }}
            >
              {shopOpen ? (
                <>
                  <Square className="w-4 h-4" />
                  Close Shop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Open Shop
                </>
              )}
            </button>

            {/* Divider */}
            <div
              className="my-5"
              style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
              }}
            />

            {/* Clock In/Out */}
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-white/60">Your Status</span>
                {clockedIn && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#a78bfa',
                    }}
                  >
                    Since {clockTime}
                  </span>
                )}
              </div>

              <button
                onClick={handleToggleClock}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold text-sm",
                  "transition-all duration-300 flex items-center justify-center gap-2",
                  "hover:-translate-y-0.5 active:translate-y-0"
                )}
                style={{
                  background: clockedIn
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: clockedIn
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(139, 92, 246, 0.3)',
                  color: clockedIn ? 'rgba(255, 255, 255, 0.6)' : '#c4b5fd',
                  boxShadow: clockedIn ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.15)',
                }}
              >
                {clockedIn ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Clock In
                  </>
                )}
              </button>

              {/* Mini Calendar */}
              <div className="mt-auto pt-5">
                <MiniCalendar currentDate={currentTime} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className={cn(
          "col-span-6 lg:col-span-2 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '150ms' }}>
          <StatCard
            emoji="🎫"
            label="Created"
            value={129}
            change={21.7}
            positive
            sublabel="tickets this month"
            sparkData={[45, 52, 48, 61, 58, 72, 68, 75, 82, 90, 95, 129]}
          />
        </div>

        <div className={cn(
          "col-span-6 lg:col-span-2 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '200ms' }}>
          <StatCard
            emoji="✅"
            label="Completed"
            value={97}
            change={120.45}
            positive
            sublabel="repairs done"
            sparkData={[30, 35, 42, 38, 55, 48, 62, 58, 70, 78, 85, 97]}
          />
        </div>

        <div className={cn(
          "col-span-6 lg:col-span-2 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '250ms' }}>
          <StatCard
            emoji="⏳"
            label="In Progress"
            value={14}
            sublabel="being worked on"
            sparkData={[8, 12, 10, 15, 11, 18, 14, 16, 12, 15, 13, 14]}
          />
        </div>

        <div className={cn(
          "col-span-6 lg:col-span-2 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '300ms' }}>
          <StatCard
            emoji="📦"
            label="Waiting Parts"
            value={3}
            sublabel="parts on order"
            warning={true}
            sparkData={[5, 4, 6, 3, 5, 4, 2, 3, 4, 2, 3, 3]}
          />
        </div>

        {/* Revenue Trend */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '350ms' }}>
          <RevenueTrendCard data={REVENUE_DATA} />
        </div>

        {/* Goals Section */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '400ms' }}>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-5 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Today's Goals</h2>
              </div>
              <button
                onClick={handleEditGoals}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Edit Goals
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <GoalProgress
                icon="💰"
                label="Revenue"
                current={847}
                target={1500}
                format="money"
              />
              <GoalProgress
                icon="🔧"
                label="Repairs"
                current={8}
                target={15}
              />
              <GoalProgress
                icon="🛍️"
                label="Accessories"
                current={3}
                target={10}
              />
            </div>
          </div>
        </div>

        {/* Team Status */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '450ms' }}>
          <TeamStatusCard members={TEAM_MEMBERS} />
        </div>

        {/* Upcoming Appointments */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '500ms' }}>
          <UpcomingRepairsCard repairs={UPCOMING_REPAIRS} />
        </div>

        {/* Low Stock Alerts */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '550ms' }}>
          <LowStockCard alerts={LOW_STOCK_ALERTS} onReorder={() => router.push('/inventory')} />
        </div>

        {/* Updates Feed */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '600ms' }}>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden h-full">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">What's New</h2>
              </div>
              <button
                onClick={handleViewAllUpdates}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {UPDATES.slice(0, 4).map((update) => (
                <button
                  key={update.id}
                  onClick={() => setSelectedUpdate(selectedUpdate === update.id ? null : update.id)}
                  className={cn(
                    "w-full p-4 text-left transition-all",
                    selectedUpdate === update.id 
                      ? "bg-[var(--bg-card-hover)]" 
                      : "hover:bg-[var(--bg-card-hover)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{update.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {update.title}
                        </span>
                        {update.badge && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            update.badgeColor === 'violet' 
                              ? "bg-violet-500/20 text-violet-300"
                              : "bg-fuchsia-500/20 text-fuchsia-300"
                          )}>
                            {update.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{update.date}</div>
                      
                      {selectedUpdate === update.id && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                          {update.preview}
                        </p>
                      )}
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform",
                      selectedUpdate === update.id && "rotate-90"
                    )} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Quick Intake */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '650ms' }}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.06] border border-violet-500/20 p-5 h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">Fixo Quick Intake</div>
                <div className="text-xs text-[var(--text-muted)]">Create tickets with AI</div>
              </div>
            </div>

            <div className="relative mt-4">
              <input
                placeholder='Try: "iPhone 14 screen for John, $199"'
                value={intakeText}
                onChange={(e) => setIntakeText(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-violet-500/50 focus:bg-[var(--bg-input-focus)] transition-all"
              />
              <button
                onClick={handleCreateFromIntake}
                onMouseDown={(e) => {
                  // Some browsers/tooling can treat this as a submit; keep it purely interactive.
                  e.preventDefault()
                  handleCreateFromIntake()
                }}
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-400 text-white flex items-center justify-center transition-colors"
                aria-label="Create ticket from intake"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Templates */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Templates</span>
                <span className="text-[10px] text-[var(--text-faint)]">Click to fill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t}
                    onClick={() => setIntakeText(t)}
                    className="px-2.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all"
                    title={t}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Live preview */}
              <div className="rounded-xl bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-muted)]">Preview</span>
                  <span className="text-[10px] text-[var(--text-faint)]">what Fixo will capture</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] p-2">
                    <div className="text-[10px] text-[var(--text-faint)] mb-0.5">Device</div>
                    <div className="text-xs text-[var(--text-primary)] truncate">{intakePreview.device}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] p-2">
                    <div className="text-[10px] text-[var(--text-faint)] mb-0.5">Customer</div>
                    <div className="text-xs text-[var(--text-primary)] truncate">{intakePreview.customer}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] p-2">
                    <div className="text-[10px] text-[var(--text-faint)] mb-0.5">Issue</div>
                    <div className="text-xs text-[var(--text-primary)] truncate">{intakePreview.issue}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] p-2">
                    <div className="text-[10px] text-[var(--text-faint)] mb-0.5">Price</div>
                    <div className="text-xs text-[var(--text-primary)] truncate">{intakePreview.price}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={cn(
          "col-span-12 lg:col-span-4 transition-all duration-500",
          animationReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: '700ms' }}>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            </div>

            <div className="space-y-3">
              <ActivityItem emoji="💰" text="Payment $219" time="5m" highlight />
              <ActivityItem emoji="🎫" text="New ticket #1052" time="12m" />
              <ActivityItem emoji="✅" text="Completed #1048" time="25m" />
              <ActivityItem emoji="👤" text="New customer: Sarah M." time="1h" />
              <ActivityItem emoji="⭐" text="5-star review received" time="2h" highlight />
              <ActivityItem emoji="📦" text="Parts delivered" time="3h" />
            </div>

            <button 
              onClick={() => router.push('/ai-activity')}
              className="w-full mt-4 text-xs text-center text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all activity →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MINI CALENDAR - ENHANCED
// ============================================

function MiniCalendar({ currentDate }: { currentDate: Date }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  // Calculate dates around current date
  const today = currentDate.getDate()
  const dayOfWeek = currentDate.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate)
    d.setDate(today + mondayOffset + i)
    return d.getDate()
  })

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day, i) => (
        <div
          key={i}
          className="text-center text-[10px] text-white/30 font-semibold py-1 uppercase tracking-wider"
        >
          {day}
        </div>
      ))}
      {dates.map((date, i) => {
        const isToday = date === today
        return (
          <button
            key={i}
            className={cn(
              "relative aspect-square rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center",
              "hover:scale-105",
              isToday ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
            )}
            style={isToday ? {
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4), 0 0 0 2px rgba(139, 92, 246, 0.2)',
            } : {}}
          >
            {isToday && (
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  animation: 'pulseGlow 3s ease-in-out infinite',
                  opacity: 0.3,
                }}
              />
            )}
            <span className="relative z-10">{date}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// STAT CARD WITH SPARKLINE - ENHANCED
// ============================================

function StatCard({
  emoji,
  label,
  value,
  change,
  positive,
  sublabel,
  warning,
  sparkData,
}: {
  emoji: string
  label: string
  value: number
  change?: number
  positive?: boolean
  sublabel: string
  warning?: boolean
  sparkData?: number[]
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl p-5 overflow-hidden",
        "transition-all duration-400 ease-out cursor-pointer",
        "hover:-translate-y-1"
      )}
      style={{
        background: warning
          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: `1px solid ${warning ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
        boxShadow: hovered
          ? warning
            ? '0 20px 40px rgba(251, 191, 36, 0.1), 0 0 0 1px rgba(251, 191, 36, 0.2)'
            : '0 20px 40px rgba(139, 92, 246, 0.1), 0 0 0 1px rgba(139, 92, 246, 0.15)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shimmer overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        )}
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)',
          animation: hovered ? 'shimmer 2s linear infinite' : 'none',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              "text-2xl transition-transform duration-300",
              hovered && "scale-110"
            )}
          >
            {emoji}
          </span>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold",
                positive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              )}
              style={{
                boxShadow: positive
                  ? '0 0 10px rgba(52, 211, 153, 0.2)'
                  : '0 0 10px rgba(251, 113, 133, 0.2)',
              }}
            >
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change.toFixed(1)}%
            </div>
          )}
        </div>

        <div
          className={cn(
            "text-3xl font-bold tracking-tight transition-all duration-300",
            hovered ? "text-white" : "text-white/90"
          )}
        >
          {value}
        </div>
        <div className="text-xs text-white/40 mt-1.5">{sublabel}</div>
        
        {/* Mini Sparkline - Enhanced */}
        {sparkData && (
          <div className="mt-4 h-10 flex items-end gap-1">
            {sparkData.map((v, i) => {
              const max = Math.max(...sparkData)
              const height = (v / max) * 100
              const isLast = i === sparkData.length - 1
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    background: isLast
                      ? warning
                        ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                        : 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%)'
                      : warning
                        ? 'rgba(251, 191, 36, 0.25)'
                        : 'rgba(139, 92, 246, 0.25)',
                    boxShadow: isLast
                      ? warning
                        ? '0 0 12px rgba(251, 191, 36, 0.4)'
                        : '0 0 12px rgba(139, 92, 246, 0.4)'
                      : 'none',
                    transform: hovered ? 'scaleY(1.05)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// GOAL PROGRESS
// ============================================

function GoalProgress({
  icon,
  label,
  current,
  target,
  format,
}: {
  icon: string
  label: string
  current: number
  target: number
  format?: 'money'
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const displayCurrent = format === 'money' ? `$${current}` : current
  const displayTarget = format === 'money' ? `$${target}` : target

  return (
    <div className="text-center p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
      <span className="text-2xl">{icon}</span>
      <div className="text-xl font-bold text-[var(--text-primary)] mt-2">{Math.round(percentage)}%</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
      
      {/* Progress Bar */}
      <div className="mt-3 h-1.5 rounded-full bg-[var(--bg-card)] overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="text-[10px] text-[var(--text-faint)] mt-2">
        {displayCurrent} / {displayTarget}
      </div>
    </div>
  )
}

// ============================================
// REVENUE TREND CARD
// ============================================

function RevenueTrendCard({ data }: { data: number[] }) {
  const total = data.reduce((a, b) => a + b, 0)
  const avg = Math.round(total / data.length)
  const max = Math.max(...data)
  const today = data[data.length - 1]
  const yesterday = data[data.length - 2]
  const change = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.1] to-teal-500/[0.05] border border-emerald-500/20 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Revenue (7 days)</h2>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          change >= 0 ? "text-emerald-400" : "text-rose-400"
        )}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>

      <div className="text-3xl font-bold text-[var(--text-primary)]">${total.toLocaleString()}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">Avg ${avg}/day · Today ${today}</div>

      {/* Bar Chart */}
      <div className="mt-4 h-20 flex items-end gap-2">
        {data.map((v, i) => {
          const height = (v / max) * 100
          const isToday = i === data.length - 1
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  isToday ? "bg-emerald-400" : "bg-emerald-400/40"
                )}
                style={{ height: `${height}%` }}
              />
              <span className="text-[9px] text-[var(--text-faint)]">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// TEAM STATUS CARD - ENHANCED
// ============================================

function TeamStatusCard({ members }: { members: typeof TEAM_MEMBERS }) {
  const statusStyles: Record<string, { bg: string; shadow: string }> = {
    working: { bg: '#4ade80', shadow: 'rgba(74, 222, 128, 0.5)' },
    available: { bg: '#60a5fa', shadow: 'rgba(96, 165, 250, 0.5)' },
    break: { bg: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.5)' },
  }

  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 100%)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
            }}
          >
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Team Status</h2>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            color: '#4ade80',
          }}
        >
          {members.filter(m => m.status === 'working').length} active
        </span>
      </div>

      <div className="space-y-2">
        {members.map((member, i) => {
          const style = statusStyles[member.status] || statusStyles.available
          return (
            <div
              key={member.id}
              className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:translate-x-1"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                {member.avatar}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{member.name}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: style.bg,
                      boxShadow: `0 0 8px ${style.shadow}`,
                    }}
                  />
                </div>
                <div className="text-xs text-white/40 truncate">
                  {member.currentTask ? (
                    <span>
                      {member.currentTask}{' '}
                      <span className="text-purple-400/60">{member.taskId}</span>
                    </span>
                  ) : (
                    member.status === 'break' ? 'On break' : 'Available'
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// UPCOMING REPAIRS CARD
// ============================================

function UpcomingRepairsCard({ repairs }: { repairs: typeof UPCOMING_REPAIRS }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Upcoming</h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{repairs.length} today</span>
      </div>

      <div className="space-y-2">
        {repairs.map((repair) => (
          <div key={repair.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
            <div className="w-14 text-center">
              <div className="text-xs font-mono text-violet-400">{repair.time}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">{repair.customer}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{repair.device} · {repair.issue}</div>
            </div>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium",
              repair.status === 'confirmed' 
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-amber-500/20 text-amber-400"
            )}>
              {repair.status === 'confirmed' ? '✓' : '?'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// LOW STOCK CARD
// ============================================

function LowStockCard({ alerts, onReorder }: { alerts: typeof LOW_STOCK_ALERTS; onReorder: () => void }) {
  return (
    <div className="rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Low Stock</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
          {alerts.length} items
        </span>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)]/50 border border-[var(--border-subtle)]">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">{alert.part}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {alert.qty} left · Reorder at {alert.reorderPoint}
              </div>
            </div>
            <div className="text-lg font-bold text-amber-400">{alert.qty}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onReorder}
        className="w-full mt-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
      >
        Reorder Parts
      </button>
    </div>
  )
}

// ============================================
// ACTIVITY ITEM
// ============================================

function ActivityItem({ emoji, text, time, highlight }: { emoji: string; text: string; time: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg transition-colors",
      highlight && "bg-violet-500/10"
    )}>
      <span className="text-base">{emoji}</span>
      <div className="flex-1 text-sm text-[var(--text-secondary)] truncate">{text}</div>
      <span className="text-xs text-[var(--text-muted)]">{time}</span>
    </div>
  )
}

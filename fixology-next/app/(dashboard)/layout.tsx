// app/(dashboard)/layout.tsx
// The new Fixology dashboard layout (auth + onboarding gate, homepage-style theme).

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Sidebar } from '@/components/dashboard/sidebar'
import { cookies } from 'next/headers'
import { TopBar } from '@/components/dashboard/topbar'
import { RoleProvider } from '@/contexts/role-context'
import { ActorProvider } from '@/contexts/actor-context'
import { OnboardingOverlay } from '@/components/dashboard/onboarding-overlay'
import { FixoLayout } from '@/components/fixo/fixo-layout'
import { ThemeProvider } from '@/contexts/theme-context'
import { Prisma } from '@prisma/client'

// Prisma is not supported in the Edge runtime. Force Node.js for all dashboard routes.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dashboardStyles = `
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}

/* ===== THEME VARIABLES ===== */
:root, [data-theme="dark"] {
  --bg-base: #07070a;
  --bg-elevated: #0a0a0e;
  --bg-card: rgba(255,255,255,0.02);
  --bg-card-hover: rgba(255,255,255,0.04);
  --bg-input: rgba(255,255,255,0.04);
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.15);
  --text-primary: rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.70);
  --text-muted: rgba(255,255,255,0.50);
  --text-faint: rgba(255,255,255,0.30);
  --accent-purple: #8B5CF6;
  --accent-fuchsia: #D946EF;
  --glow-purple: rgba(139, 92, 246, 0.12);
  --glow-fuchsia: rgba(168, 85, 247, 0.08);
  --shadow-color: rgba(0,0,0,0.5);
  --dropdown-bg: rgba(0,0,0,0.70);
  --sidebar-bg: rgba(7,7,10,0.95);
}

[data-theme="light"] {
  --bg-base: #f5f5f7;
  --bg-elevated: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f5f5f7;
  --bg-input: #ffffff;
  --border-subtle: rgba(0,0,0,0.06);
  --border-default: rgba(0,0,0,0.12);
  --border-strong: rgba(0,0,0,0.20);
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #6b6b6b;
  --text-faint: #9a9a9a;
  --accent-purple: #7C3AED;
  --accent-fuchsia: #C026D3;
  --glow-purple: rgba(124, 58, 237, 0.05);
  --glow-fuchsia: rgba(192, 38, 211, 0.03);
  --shadow-color: rgba(0,0,0,0.06);
  --dropdown-bg: #ffffff;
  --sidebar-bg: rgba(255,255,255,0.98);
}

body {
  background: var(--bg-base);
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--text-primary);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.bg-structure {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(ellipse 100% 80% at 0% 0%, var(--glow-purple), transparent 50%),
    radial-gradient(ellipse 80% 60% at 100% 100%, var(--glow-fuchsia), transparent 50%),
    linear-gradient(180deg, var(--bg-base) 0%, var(--bg-elevated) 100%);
  z-index: -1;
  transition: background 0.2s ease;
}

.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:none;z-index:-1}
.vertical-rail{display:none}
.glow-spot{position:absolute;width:540px;height:540px;background:radial-gradient(circle,var(--glow-purple) 0%,transparent 70%);filter:blur(90px);pointer-events:none;z-index:0}
.dash-shell{min-height:100vh;position:relative}
.dash-main{min-height:100vh;padding-left:72px;transition:padding-left 0.3s ease-out}
@media (max-width: 1024px){.dash-main{padding-left:0}}

/* Theme-aware utility overrides */
[data-theme="light"] .bg-white\\/\\[0\\.02\\],
[data-theme="light"] .bg-white\\/\\[0\\.03\\],
[data-theme="light"] .bg-white\\/\\[0\\.04\\] {
  background: var(--bg-card) !important;
}
[data-theme="light"] .border-white\\/\\[0\\.06\\],
[data-theme="light"] .border-white\\/\\[0\\.08\\],
[data-theme="light"] .border-white\\/10 {
  border-color: var(--border-default) !important;
}
[data-theme="light"] .text-white\\/95,
[data-theme="light"] .text-white\\/90,
[data-theme="light"] .text-white {
  color: var(--text-primary) !important;
}
[data-theme="light"] .text-white\\/70,
[data-theme="light"] .text-white\\/80 {
  color: var(--text-secondary) !important;
}
[data-theme="light"] .text-white\\/50,
[data-theme="light"] .text-white\\/60 {
  color: var(--text-muted) !important;
}
[data-theme="light"] .text-white\\/30,
[data-theme="light"] .text-white\\/40 {
  color: var(--text-faint) !important;
}

/* Topbar and Sidebar theme support */
.topbar-bg {
  background: rgba(7, 7, 10, 0.85);
  transition: background-color 0.2s ease;
}
[data-theme="light"] .topbar-bg {
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom-color: rgba(0,0,0,0.12) !important;
}

.sidebar-bg {
  background: rgba(10, 10, 14, 0.90);
  transition: background-color 0.2s ease;
}
[data-theme="light"] .sidebar-bg {
  background: rgba(255, 255, 255, 0.98) !important;
  border-right-color: rgba(0,0,0,0.12) !important;
}

/* Light mode button/input overrides */
[data-theme="light"] .bg-white\\/\\[0\\.05\\],
[data-theme="light"] .bg-white\\/\\[0\\.06\\],
[data-theme="light"] .bg-white\\/\\[0\\.08\\] {
  background: #f5f5f7 !important;
  border-color: rgba(0,0,0,0.12) !important;
  color: #4a4a4a !important;
}
[data-theme="light"] .hover\\:bg-white\\/\\[0\\.06\\]:hover,
[data-theme="light"] .hover\\:bg-white\\/\\[0\\.08\\]:hover,
[data-theme="light"] .hover\\:bg-white\\/10:hover {
  background: #ebebed !important;
  color: #1a1a1a !important;
}

/* Light mode dropdown backgrounds - Clean white */
[data-theme="light"] [data-radix-popper-content-wrapper] > div {
  background: #ffffff !important;
  border-color: rgba(0,0,0,0.12) !important;
  box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important;
}
[data-theme="light"] [data-radix-popper-content-wrapper] [role="menuitem"]:hover {
  background: #f5f5f7 !important;
}

/* Light mode purple accent adjustments */
[data-theme="light"] .bg-\\[\\#8B5CF6\\]\\/20,
[data-theme="light"] .bg-purple-500\\/20,
[data-theme="light"] .bg-violet-500\\/20 {
  background: #f3f0ff !important;
}

/* Light mode text colors for purple */
[data-theme="light"] .text-purple-400,
[data-theme="light"] .text-purple-300,
[data-theme="light"] .text-violet-400,
[data-theme="light"] .text-violet-300 {
  color: #7C3AED !important;
}

/* Light mode icon colors - darker versions */
[data-theme="light"] .text-emerald-400, [data-theme="light"] .text-emerald-300 { color: #059669 !important; }
[data-theme="light"] .text-amber-400, [data-theme="light"] .text-amber-300 { color: #D97706 !important; }
[data-theme="light"] .text-rose-400, [data-theme="light"] .text-rose-300 { color: #DC2626 !important; }
[data-theme="light"] .text-blue-400, [data-theme="light"] .text-blue-300 { color: #2563EB !important; }

/* Light mode progress bars and badges */
[data-theme="light"] .bg-white\\/10 { background: rgba(0,0,0,0.06) !important; }
[data-theme="light"] .bg-violet-500 { background: #7C3AED !important; }
[data-theme="light"] .bg-purple-500 { background: #7C3AED !important; }

/* Light mode status badges - solid backgrounds */
[data-theme="light"] .bg-emerald-500\\/20 { background: #ecfdf5 !important; }
[data-theme="light"] .bg-amber-500\\/20 { background: #fffbeb !important; }
[data-theme="light"] .bg-rose-500\\/20 { background: #fef2f2 !important; }
[data-theme="light"] .bg-blue-500\\/20 { background: #eff6ff !important; }

/* Light mode background structure - no gradients */
[data-theme="light"] .bg-structure {
  background: #f5f5f7 !important;
}
[data-theme="light"] .glow-spot {
  opacity: 0.3;
}

/* Header buttons - notification bell and user dropdown */
[data-theme="light"] header button[class*="bg-white"],
[data-theme="light"] .topbar-bg button[class*="bg-white"] {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  color: #4a4a4a !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
}
[data-theme="light"] header button[class*="bg-white"]:hover,
[data-theme="light"] .topbar-bg button[class*="bg-white"]:hover {
  background-color: #f5f5f7 !important;
  border-color: rgba(0, 0, 0, 0.20) !important;
  color: #1a1a1a !important;
}
[data-theme="light"] header button svg,
[data-theme="light"] .topbar-bg button svg {
  color: #4a4a4a !important;
}
[data-theme="light"] header button:hover svg,
[data-theme="light"] .topbar-bg button:hover svg {
  color: #1a1a1a !important;
}

/* ============================================
   GHOST BUTTON VISIBILITY FIXES
   Tags, Sort, Vendor, Clear, Cancel, Message, Reorder
   ============================================ */

/* All buttons with transparent/white backgrounds need visible styling */
[data-theme="light"] button:not([class*="bg-gradient"]):not([class*="bg-violet"]):not([class*="bg-purple"]):not([class*="from-violet"]):not([class*="from-purple"]) {
  /* Default: ensure text is visible */
}

/* Specifically target buttons using white/[opacity] */
[data-theme="light"] button.bg-white\\/\\[0\\.04\\],
[data-theme="light"] button.bg-white\\/\\[0\\.05\\],
[data-theme="light"] button.bg-white\\/\\[0\\.06\\],
[data-theme="light"] button.bg-white\\/\\[0\\.08\\],
[data-theme="light"] button.bg-transparent {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #4a4a4a !important;
}

[data-theme="light"] button.bg-white\\/\\[0\\.04\\]:hover,
[data-theme="light"] button.bg-white\\/\\[0\\.05\\]:hover,
[data-theme="light"] button.bg-white\\/\\[0\\.06\\]:hover,
[data-theme="light"] button.bg-white\\/\\[0\\.08\\]:hover,
[data-theme="light"] button.bg-transparent:hover {
  background-color: #f5f5f7 !important;
  border-color: rgba(0, 0, 0, 0.20) !important;
  color: #1a1a1a !important;
}

/* Table header rows */
[data-theme="light"] thead,
[data-theme="light"] [class*="bg-\\[\\#1"][class*="\\]"],
[data-theme="light"] [class*="bg-\\[\\#0"][class*="\\]"] {
  background-color: #f0f0f2 !important;
}

[data-theme="light"] thead th,
[data-theme="light"] thead td {
  color: #6b6b6b !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

/* Customer tags - VIP, Warranty, Business, New, etc */
[data-theme="light"] span[class*="bg-violet-500\\/10"],
[data-theme="light"] span[class*="bg-violet-500\\/15"],
[data-theme="light"] span[class*="bg-purple-500\\/10"],
[data-theme="light"] span[class*="bg-purple-500\\/15"],
[data-theme="light"] span[class*="bg-fuchsia-500\\/10"],
[data-theme="light"] span[class*="bg-fuchsia-500\\/15"] {
  background-color: #f3f0ff !important;
  border: 1px solid #ddd6fe !important;
}
[data-theme="light"] span[class*="text-violet-"],
[data-theme="light"] span[class*="text-purple-"],
[data-theme="light"] span[class*="text-fuchsia-"] {
  color: #7C3AED !important;
}

/* Low stock cards - part names need to be visible */
[data-theme="light"] [class*="text-white\\/90"],
[data-theme="light"] [class*="text-white\\/85"],
[data-theme="light"] [class*="text-white\\/80"] {
  color: #1a1a1a !important;
}

/* Text inside cards - ensure visibility */
[data-theme="light"] div[class*="bg-white"] p,
[data-theme="light"] div[class*="bg-white"] span,
[data-theme="light"] div[class*="bg-white"] h1,
[data-theme="light"] div[class*="bg-white"] h2,
[data-theme="light"] div[class*="bg-white"] h3,
[data-theme="light"] div[class*="bg-white"] h4 {
  color: inherit;
}

/* "No data" and subtle badges */
[data-theme="light"] [class*="bg-white\\/10"],
[data-theme="light"] [class*="bg-white\\/15"],
[data-theme="light"] [class*="bg-white\\/20"] {
  background-color: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.10) !important;
}
`

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
  const cookieStore = cookies()
  const isDemo = cookieStore.get('fx_demo')?.value === '1'

  // UI-only demo mode: no Supabase, no DB, no subscription gates.
  // Used for building/previewing the dashboard without backend dependencies.
  const renderDemo = () => {
    const demoUser = {
      name: 'Demo User',
      email: 'demo@fixology.local',
      role: 'OWNER',
    }
    const demoShop = {
      name: 'Demo Shop',
      plan: 'PRO',
      city: 'Austin',
      state: 'TX',
    }

    return (
      <ThemeProvider>
        <RoleProvider initialRole={demoUser.role as any}>
          <ActorProvider initialOwnerName={demoUser.name}>
            <FixoLayout>
              <div className="dash-shell">
                <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
                <div className="bg-structure">
                  <div className="bg-grid" />
                  <div className="vertical-rail left" />
                  <div className="vertical-rail right" />
                </div>

                <div className="glow-spot" style={{ top: '8%', left: '12%' }} />
                <div className="glow-spot" style={{ bottom: '10%', right: '12%', opacity: 0.75 }} />

                <Sidebar user={demoUser} shop={demoShop} />
                <main className="dash-main">
                  <TopBar user={demoUser} shop={demoShop} />
                  <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">{children}</div>
                </main>
                <OnboardingOverlay />
              </div>
            </FixoLayout>
          </ActorProvider>
        </RoleProvider>
      </ThemeProvider>
    )
  }

  if (isDemo) return renderDemo()

  let session: any = null
  try {
    const supabase = createClient()
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    session = s
  } catch (e) {
    // If Supabase env vars are missing/misconfigured, don't hard-crash the dashboard.
    // Let the user go to login (or keep using demo mode in dev).
    console.error('Supabase session error in dashboard:', e)
    redirect('/login')
  }

  // Dev UX: if you aren't logged in, still show the UI in demo mode (fast iteration).
  // Production still requires a real session.
  if (!session && process.env.NODE_ENV !== 'production') {
    return renderDemo()
  }

  if (!session) redirect('/login')

  // Get shop user info
  let shopUser
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
    )
    
    shopUser = await Promise.race([
      prisma.shopUser.findFirst({
        where: {
          email: session.user.email!,
          status: 'ACTIVE',
        },
        include: {
          shop: {
            // Avoid selecting columns that may not exist yet in production (e.g. imei_credits).
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              zip: true,
              timezone: true,
              onboardingCompletedAt: true,
              businessHours: true,
              repairFocus: true,
              plan: true,
              status: true,
              trialEndsAt: true,
              features: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
            },
          },
        },
      }),
      timeoutPromise,
    ]) as any
  } catch (dbError: any) {
    // Dev UX: if DB is unavailable, keep the UI accessible in demo mode.
    if (process.env.NODE_ENV !== 'production') {
      console.error('Database connection error (dev) — falling back to demo UI:', dbError)
      return renderDemo()
    }

    // Database/schema error - show helpful message (avoid blank 500 page)
    console.error('Database connection error:', dbError)

    // Prisma "missing column" (schema out of date)
    if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2022') {
      const missingColumn = (dbError.meta as any)?.column as string | undefined
      return (
        <div className="min-h-screen bg-[#07070a] flex items-center justify-center px-6">
          <div className="glass-card" style={{ maxWidth: 760, width: '100%', padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(196,181,253,.9)' }}>Fixology</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 10 }}>
              Database needs an update
            </h1>
            <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 14 }}>
              Your Supabase database is missing a column the app expects.
            </p>
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(167,139,250,.18)',
                background: 'rgba(15,10,26,.45)',
                color: 'rgba(196,181,253,.75)',
                fontSize: 12,
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              <div style={{ color: 'rgba(196,181,253,.9)', fontWeight: 900, marginBottom: 6 }}>Missing column</div>
              <div>{missingColumn || 'P2022 (unknown column)'}</div>
            </div>
            <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 10 }}>
              Fix: apply the latest Prisma migrations (recommended), or run the one-time SQL:
            </p>
            <pre
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,.10)',
                background: 'rgba(0,0,0,.35)',
                color: 'rgba(196,181,253,.9)',
                fontSize: 12,
                overflowX: 'auto',
                marginBottom: 14,
              }}
            >
{`ALTER TABLE "shops"
  ADD COLUMN IF NOT EXISTS "imei_credits" INTEGER NOT NULL DEFAULT 0;`}
            </pre>
            <a className="glow-button" href="/login" style={{ display: 'inline-block', padding: '12px 16px' }}>
              Back to login
            </a>
          </div>
        </div>
      )
    }

    const errorMessage = dbError.message || 'Unknown database error'
    const isAuthError = errorMessage.includes('Authentication failed') || errorMessage.includes('credentials') || errorMessage.includes('P1000')
    const isTimeout = errorMessage.includes('timeout')
    const isConnectionError = errorMessage.includes('Can\'t reach') || errorMessage.includes('P1001')
    
    if (isAuthError) {
      const dbUrl = process.env.DATABASE_URL || '(not set)'
      const dbHost = dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'unknown'
      throw new Error(
        `Database authentication failed. Please verify:\n1. The password in DATABASE_URL matches your Supabase database password\n2. The username format is correct (postgres.mvvkcwgzkygiwihakdft for shared pooler)\n3. You're using the pooler connection (port 6543), not direct (port 5432)\n\nCurrent host: ${dbHost}\nError: ${errorMessage}`
      )
    }
    
    if (isTimeout || isConnectionError) {
      throw new Error(
        `Database connection failed. Check your DATABASE_URL in .env.local. It should use the Supabase pooler (port 6543), not direct connection (port 5432). Current error: ${errorMessage}`
      )
    }
    throw dbError
  }

  if (!shopUser) {
    redirect('/login?error=no_shop')
  }

  // Subscription gating:
  // No dashboard access unless ACTIVE or an unexpired TRIAL.
  const status = shopUser.shop.status
  const now = new Date()
  const trialEndsAt = shopUser.shop.trialEndsAt

  if (status === 'TRIAL') {
    if (!trialEndsAt || trialEndsAt.getTime() <= now.getTime()) {
      redirect('/onboarding?billing=required&reason=trial_expired')
    }
  } else if (status !== 'ACTIVE') {
    // PAST_DUE / SUSPENDED / CANCELLED and any other state is locked
    redirect('/onboarding?billing=required&reason=subscription_inactive')
  }

  // Dashboard requires onboarding completion (so the UI is personalized).
  if (!shopUser.shop.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return (
    <ThemeProvider>
      <RoleProvider initialRole={shopUser.role as any}>
        <ActorProvider initialOwnerName={shopUser.name}>
          <FixoLayout>
            <div className="dash-shell">
              <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
              <div className="bg-structure">
                <div className="bg-grid" />
                <div className="vertical-rail left" />
                <div className="vertical-rail right" />
              </div>

              <div className="glow-spot" style={{ top: '8%', left: '12%' }} />
              <div className="glow-spot" style={{ bottom: '10%', right: '12%', opacity: 0.75 }} />

              <Sidebar
                user={{
                  name: shopUser.name,
                  email: shopUser.email,
                  role: shopUser.role,
                }}
                shop={{
                  name: shopUser.shop.name,
                  plan: shopUser.shop.plan,
                  city: shopUser.shop.city || undefined,
                  state: shopUser.shop.state || undefined,
                }}
              />

              <main className="dash-main">
                <TopBar
                  user={{
                    name: shopUser.name,
                    email: shopUser.email,
                    role: shopUser.role,
                  }}
                  shop={{
                    name: shopUser.shop.name,
                    plan: shopUser.shop.plan,
                    city: shopUser.shop.city || undefined,
                    state: shopUser.shop.state || undefined,
                  }}
                />
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">{children}</div>
              </main>
            </div>
          </FixoLayout>
        </ActorProvider>
      </RoleProvider>
    </ThemeProvider>
  )
  } catch (err: any) {
    // Preserve Next.js control-flow errors (redirect/notFound) so routing still works.
    const digest = typeof err?.digest === 'string' ? err.digest : ''
    if (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND')) {
      throw err
    }

    return (
      <div className="min-h-screen bg-[#07070a] flex items-center justify-center px-6">
        <div className="glass-card" style={{ maxWidth: 860, width: '100%', padding: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(196,181,253,.9)' }}>Fixology</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 10, marginBottom: 10 }}>
            Dashboard crashed (server-side)
          </h1>
          <p style={{ color: 'rgba(196,181,253,.75)', lineHeight: 1.7, marginBottom: 14 }}>
            This page is currently failing to render on the server. The details below will tell us exactly what to fix.
          </p>
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: '1px solid rgba(167,139,250,.18)',
              background: 'rgba(15,10,26,.45)',
              color: 'rgba(196,181,253,.85)',
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 16,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Debug</div>
            <div>Digest: {digest || 'n/a'}</div>
            <div style={{ marginTop: 8 }}>{String(err?.message || err || '')}</div>
          </div>
          <a className="glow-button" href="/login" style={{ display: 'inline-block', padding: '12px 16px' }}>
            Back to login
          </a>
        </div>
      </div>
    )
  }
}


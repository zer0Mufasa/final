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

const dashboardStyles = `
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
body{background:#07070a;min-height:100vh;overflow-x:hidden;color:rgba(255,255,255,0.9)}
.bg-structure{position:fixed;top:0;left:0;right:0;bottom:0;background:
  radial-gradient(ellipse 100% 80% at 0% 0%, rgba(139, 92, 246, 0.12), transparent 50%),
  radial-gradient(ellipse 80% 60% at 100% 100%, rgba(168, 85, 247, 0.08), transparent 50%),
  linear-gradient(180deg, #07070a 0%, #0a0a0e 100%);z-index:-1}
.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background:none;z-index:-1}
.vertical-rail{display:none}
.glow-spot{position:absolute;width:540px;height:540px;background:radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%);filter:blur(90px);pointer-events:none;z-index:0}
.dash-shell{min-height:100vh;position:relative}
.dash-main{min-height:100vh;padding-left:256px}
@media (max-width: 1024px){.dash-main{padding-left:0}}
`

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <RoleProvider initialRole={demoUser.role as any}>
        <ActorProvider initialOwnerName={demoUser.name}>
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
        </ActorProvider>
      </RoleProvider>
    )
  }

  if (isDemo) return renderDemo()

  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

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
          shop: true,
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

    // Database connection error - show helpful message
    console.error('Database connection error:', dbError)
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
    <RoleProvider initialRole={shopUser.role as any}>
      <ActorProvider initialOwnerName={shopUser.name}>
        <div className="dash-shell">
          <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
          <div className="bg-structure">
            <div className="bg-grid" />
            <div className="vertical-rail left" />
            <div className="vertical-rail right" />
          </div>

          <div className="glow-spot" style={{ top: '8%', left: '12%' }} />
          <div className="glow-spot" style={{ bottom: '10%', right: '12%', opacity: 0.75 }} />

          {/* Sidebar for non-dashboard pages - dashboard page renders its own LeftRail */}
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
      </ActorProvider>
    </RoleProvider>
  )
}


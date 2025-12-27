// app/(dashboard)/layout.tsx
// The new Fixology dashboard layout (auth + onboarding gate, homepage-style theme).

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { Sidebar } from '@/components/dashboard/sidebar'

const dashboardStyles = `
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
body{background:#0f0a1a;min-height:100vh;overflow-x:hidden;color:#EDE9FE}
.bg-structure{position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 50% 50%,#1a0f2e 0%,#0f0a1a 100%);z-index:-1}
.bg-grid{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(167,139,250,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.03) 1px,transparent 1px);background-size:60px 60px;z-index:-1}
.vertical-rail{position:fixed;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(167,139,250,0.08),transparent);z-index:1;pointer-events:none}
.vertical-rail.left{left:clamp(20px, 5vw, 80px)}
.vertical-rail.right{right:clamp(20px, 5vw, 80px)}
.glow-spot{position:absolute;width:640px;height:640px;background:radial-gradient(circle,rgba(167,139,250,0.10) 0%,transparent 70%);filter:blur(90px);pointer-events:none;z-index:0}
.dash-shell{min-height:100vh;position:relative}
.dash-main{min-height:100vh;padding-left:0;transition:padding-left 0.3s ease-out}
@media (max-width: 1024px){.dash-main{padding-left:0}
`

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

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

  if (shopUser.shop.status === 'CANCELLED' || shopUser.shop.status === 'SUSPENDED') {
    redirect('/login?error=shop_inactive')
  }

  // Dashboard requires onboarding completion (so the UI is personalized).
  if (!shopUser.shop.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return (
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

      <main className="dash-main">{children}</main>
    </div>
  )
}


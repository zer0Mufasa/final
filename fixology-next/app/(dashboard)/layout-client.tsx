'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/topbar'
import { RoleProvider } from '@/contexts/role-context'
import { ActorProvider } from '@/contexts/actor-context'
import { OnboardingOverlay } from '@/components/dashboard/onboarding-overlay'
import { FixoLayout } from '@/components/fixo/fixo-layout'
import { ThemeProvider } from '@/contexts/theme-context'

const dashboardStyles = `
body{background:#07070a;min-height:100vh;overflow-x:hidden;color:rgba(255,255,255,.95)}
.dash-shell{min-height:100vh;position:relative}
.dash-main{min-height:100vh;padding-left:72px}
@media (max-width: 1024px){.dash-main{padding-left:0}}
.bg-structure{position:fixed;inset:0;background:
  radial-gradient(ellipse 100% 80% at 0% 0%, rgba(139,92,246,.12), transparent 50%),
  radial-gradient(ellipse 80% 60% at 100% 100%, rgba(168,85,247,.08), transparent 50%),
  linear-gradient(180deg, #07070a 0%, #0a0a0e 100%);z-index:-1}
.glow-spot{position:absolute;width:540px;height:540px;background:radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%);filter:blur(90px);pointer-events:none;z-index:0}
`

type MeResponse =
  | { type: 'shop_user'; user: { name: string; email: string; role: string; shopId: string }; shop: { id: string; name: string; plan: string; status: string } }
  | { type: 'platform_admin'; user: { name: string; email: string; role: string } }
  | { error: string }

type ShopDetails = {
  id: string
  name: string
  plan: string
  status: string
  city?: string | null
  state?: string | null
  trialEndsAt?: string | null
  onboardingCompletedAt?: string | null
}

async function getJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number; error: any }> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { credentials: 'include', signal: controller.signal })
    clearTimeout(t)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, error: data }
    return { ok: true, data: data as T }
  } catch (e) {
    return { ok: false, status: 0, error: e }
  }
}

function hasDemoCookie() {
  return typeof document !== 'undefined' && document.cookie.includes('fx_demo=1')
}

function enterDemoMode() {
  try {
    document.cookie = `fx_demo=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  } catch {}
  window.location.reload()
}

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [demo, setDemo] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [shop, setShop] = useState<ShopDetails | null>(null)
  const [error, setError] = useState<string>('')

  const demoUser = useMemo(
    () => ({ name: 'Demo User', email: 'demo@fixology.local', role: 'OWNER' }),
    []
  )
  const demoShop = useMemo(
    () => ({ name: 'Demo Shop', plan: 'PRO', city: 'Austin', state: 'TX' }),
    []
  )

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')

      if (hasDemoCookie()) {
        if (!cancelled) {
          setDemo(true)
          setUser(demoUser)
          setShop({ id: 'demo', name: demoShop.name, plan: demoShop.plan, status: 'ACTIVE', city: demoShop.city, state: demoShop.state })
          setLoading(false)
        }
        return
      }

      const meRes = await getJson<MeResponse>('/api/me')
      if (!meRes.ok) {
        if (!cancelled) {
          setError('You are not signed in. Please log in, or continue in demo mode.')
          setLoading(false)
        }
        return
      }

      const me = meRes.data as any
      if (me?.type !== 'shop_user') {
        if (!cancelled) {
          setError('You are not signed in. Please log in, or continue in demo mode.')
          setLoading(false)
        }
        return
      }

      const baseShop = me.shop as { id: string; name: string; plan: string; status: string }
      const userObj = me.user as { name: string; email: string; role: string }

      // Try to load fuller shop details (trialEndsAt, onboardingCompletedAt, city/state).
      const shopRes = await getJson<any>(`/api/shops/${baseShop.id}`)
      const fullShop: ShopDetails = shopRes.ok
        ? {
            id: baseShop.id,
            name: shopRes.data?.name ?? baseShop.name,
            plan: shopRes.data?.plan ?? baseShop.plan,
            status: shopRes.data?.status ?? baseShop.status,
            city: shopRes.data?.city ?? null,
            state: shopRes.data?.state ?? null,
            trialEndsAt: shopRes.data?.trialEndsAt ?? null,
            onboardingCompletedAt: shopRes.data?.onboardingCompletedAt ?? null,
          }
        : { id: baseShop.id, name: baseShop.name, plan: baseShop.plan, status: baseShop.status }

      // Basic gating (best-effort; avoids server 500s)
      try {
        const now = Date.now()
        if (fullShop.status === 'TRIAL' && fullShop.trialEndsAt) {
          const t = new Date(fullShop.trialEndsAt).getTime()
          if (Number.isFinite(t) && t <= now) {
            router.replace('/onboarding?billing=required&reason=trial_expired')
            return
          }
        }
        if (fullShop.status !== 'ACTIVE' && fullShop.status !== 'TRIAL') {
          router.replace('/onboarding?billing=required&reason=subscription_inactive')
          return
        }
        if (!fullShop.onboardingCompletedAt) {
          router.replace('/onboarding')
          return
        }
      } catch {
        // ignore gating errors; still render
      }

      if (!cancelled) {
        setDemo(false)
        setUser(userObj)
        setShop(fullShop)
        setLoading(false)
      }
    }

    run().catch((e) => {
      if (!cancelled) {
        setError(String((e as any)?.message || e || 'Failed to load dashboard'))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [router, demoUser, demoShop])

  if (loading) {
    return (
      <ThemeProvider>
        <div className="dash-shell">
          <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
          <div className="bg-structure" />
          <div className="glow-spot" style={{ top: '8%', left: '12%' }} />
          <div className="glow-spot" style={{ bottom: '10%', right: '12%', opacity: 0.75 }} />
          <div className="mx-auto max-w-[900px] px-6 py-20 text-white/70">Loading your dashboard…</div>
        </div>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="dash-shell">
          <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
          <div className="bg-structure" />
          <div className="mx-auto max-w-[900px] px-6 py-20 text-white/80">
            <div className="text-white font-semibold">Dashboard couldn’t load</div>
            <div className="mt-2 text-white/60">{error}</div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                onClick={() => (window.location.href = '/login')}
                className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-white hover:bg-white/15"
              >
                Go to login
              </button>
              <button
                onClick={enterDemoMode}
                className="rounded-xl bg-purple-500/20 border border-purple-400/30 px-4 py-2 text-purple-100 hover:bg-purple-500/25"
              >
                Continue in demo mode
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-white/80 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  const effectiveUser = user || demoUser
  const effectiveShop = shop || { id: 'demo', name: demoShop.name, plan: demoShop.plan, status: 'ACTIVE', city: demoShop.city, state: demoShop.state }

  return (
    <ThemeProvider>
      <RoleProvider initialRole={effectiveUser.role as any}>
        <ActorProvider initialOwnerName={effectiveUser.name}>
          <FixoLayout>
            <div className="dash-shell">
              <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
              <div className="bg-structure" />
              <div className="glow-spot" style={{ top: '8%', left: '12%' }} />
              <div className="glow-spot" style={{ bottom: '10%', right: '12%', opacity: 0.75 }} />

              <Sidebar
                user={{ name: effectiveUser.name, email: effectiveUser.email, role: effectiveUser.role }}
                shop={{ name: effectiveShop.name, plan: effectiveShop.plan, city: effectiveShop.city || undefined, state: effectiveShop.state || undefined }}
              />

              <main className="dash-main">
                <TopBar
                  user={{ name: effectiveUser.name, email: effectiveUser.email, role: effectiveUser.role }}
                  shop={{ name: effectiveShop.name, plan: effectiveShop.plan, city: effectiveShop.city || undefined, state: effectiveShop.state || undefined }}
                />
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">{children}</div>
              </main>

              {/* Demo overlay still useful */}
              {demo && <OnboardingOverlay />}
            </div>
          </FixoLayout>
        </ActorProvider>
      </RoleProvider>
    </ThemeProvider>
  )
}


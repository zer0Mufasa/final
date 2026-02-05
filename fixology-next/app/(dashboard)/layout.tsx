import type { ReactNode } from 'react'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { cookies } from 'next/headers'

// IMPORTANT:
// On Vercel, we have seen production-only 500s on all dashboard routes.
// The fastest way to harden this is to avoid server-importing the entire dashboard UI tree.
// We render the unauthenticated gate server-side, but load the full dashboard shell client-side.
const DashboardClientLayout = nextDynamic(
  () => import('./layout-client').then((m) => m.DashboardClientLayout),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#07070a] text-white">
        <div className="mx-auto max-w-[900px] px-6 py-20 text-white/70">Loading your dashboard…</div>
      </div>
    ),
  }
)

// Render a server-side gate when clearly unauthenticated, so the embedded browser
// never gets stuck on an infinite client-side loader if hydration fails.
export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieList = cookies().getAll()
  const isDemo = cookieList.some((c) => c.name === 'fx_demo' && c.value === '1')
  const hasAuthCookie = cookieList.some(
    (c) =>
      c.name === 'admin_token' ||
      c.name.startsWith('sb-') ||
      c.name.includes('supabase') ||
      c.name.includes('sb-access-token') ||
      c.name.includes('sb-refresh-token')
  )

  if (!isDemo && !hasAuthCookie) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white">
        <div className="mx-auto max-w-[900px] px-6 py-20">
          <div className="text-2xl font-semibold">Fixology Dashboard</div>
          <div className="mt-2 text-white/70">
            You’re not signed in yet. If you keep seeing “Loading your dashboard…”, use one of these to continue.
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-white hover:bg-white/15"
            >
              Go to login
            </Link>
            <Link
              href="/api/demo/start?next=/dashboard"
              className="rounded-xl bg-purple-500/20 border border-purple-400/30 px-4 py-2 text-purple-100 hover:bg-purple-500/25"
            >
              Continue in demo mode
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <DashboardClientLayout>{children}</DashboardClientLayout>
}


import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { verifyAdminTokenEdge } from './lib/admin/auth-edge'

// Supabase SSR session refresh middleware (official cookie-sync pattern).
// This ensures server components see the latest session and prevents
// "sign in → refresh → back to login" loops.
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Admin gate (separate from Supabase): protect /admin and /api/admin with admin_token.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isAdminLoginPage = pathname === '/admin/login'
    const isAdminAuthRoute = pathname.startsWith('/api/admin/auth/')

    // Allow unauthenticated access to login + auth endpoints
    if (isAdminLoginPage || isAdminAuthRoute) {
      return NextResponse.next()
    }

    const token = request.cookies.get('admin_token')?.value
    if (!token) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const admin = await verifyAdminTokenEdge(token)
    if (!admin) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const res = NextResponse.redirect(new URL('/admin/login', request.url))
      res.cookies.set({ name: 'admin_token', value: '', path: '/' })
      return res
    }

    // Add admin info to headers for server components / API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-id', admin.id)
    requestHeaders.set('x-admin-role', admin.role)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  // Skip non-admin API routes entirely (avoids extra Supabase auth calls on every fetch).
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const secure = request.nextUrl.protocol === 'https:'
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the request cookies so subsequent reads in this middleware
          // can see the new value, then set the outgoing response cookie.
          request.cookies.set({ name, value, ...options, secure })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options, secure })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options, secure })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options, secure })
        },
      },
    }
  )

  // IMPORTANT: keep this lightweight to avoid Supabase auth rate limits in dev.
  // `getSession()` reads from cookies and will refresh only when needed.
  try {
    await supabase.auth.getSession()
  } catch {
    // Best-effort: never break requests due to auth refresh failures.
  }

  return response
}

export const config = {
  matcher: [
    // Only protect app pages (keeps middleware from running on every asset/request)
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/tickets/:path*',
    '/customers/:path*',
    '/inventory/:path*',
    '/invoices/:path*',
    '/reports/:path*',
    '/calendar/:path*',
    '/messages/:path*',
    '/team/:path*',
    '/settings/:path*',
    '/diagnostics/:path*',
    '/imei/:path*',
    '/autopilot/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
  ],
}


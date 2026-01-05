import { NextResponse, type NextRequest } from 'next/server'
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

  // For non-admin pages we do NOT run session refresh in middleware.
  // It has proven fragile in some deployments and can cause global 500s on every matched route.
  // Server components/routes should fetch sessions directly (we already do this in layouts and API routes).
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only protect admin surfaces (keeps middleware from running on every app page/request)
    '/api/admin/:path*',
    '/admin/:path*',
  ],
}


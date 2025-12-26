// middleware.ts
// IMPORTANT:
// Next.js Middleware runs in the Edge Runtime.
// Importing Supabase server SDKs here can pull in Node-only APIs and crash
// public pages like /login (this is why Vercel showed Edge Runtime warnings).
//
// We already enforce auth in Server Components/layouts (e.g. dashboard layout),
// so middleware only needs to pass through.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


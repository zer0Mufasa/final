import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const next = url.searchParams.get('next') || '/dashboard'

  const res = NextResponse.redirect(new URL(next, url.origin))

  // Enable demo mode for 7 days.
  res.cookies.set('fx_demo', '1', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })

  // Set a sensible default actor for server-side attribution in demo mode.
  const actorPayload = encodeURIComponent(JSON.stringify({ id: 'owner', name: 'Owner', role: 'OWNER' }))
  res.cookies.set('fx_actor', actorPayload, { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })

  return res
}


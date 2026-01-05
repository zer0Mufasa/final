import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'impersonate') && !canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const shop = await prisma.shop.findUnique({ where: { id: params.id }, select: { id: true, name: true } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const owner = await prisma.shopUser.findFirst({
    where: { shopId: params.id, role: 'OWNER' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true },
  })
  if (!owner?.email) return NextResponse.json({ error: 'No owner found for shop' }, { status: 404 })

  const secure = request.nextUrl.protocol === 'https:'
  let response = NextResponse.json({ ok: true, shopId: shop.id, ownerEmail: owner.email })

  // 1) Create a magiclink using Supabase service role
  const supabaseAdmin = createAdminClient()
  const linkRes: any = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: owner.email,
  } as any)
  const tokenHash = linkRes?.data?.properties?.hashed_token || linkRes?.data?.properties?.hashedToken || null

  if (!tokenHash) {
    return NextResponse.json(
      { error: 'Failed to generate impersonation link', detail: 'Missing hashed_token. Ensure SUPABASE_SERVICE_ROLE_KEY is set.' },
      { status: 500 }
    )
  }

  // 2) Exchange token_hash for a session (anon client)
  const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const verify = await supabaseAnon.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash })
  if (verify.error || !verify.data.session) {
    return NextResponse.json(
      { error: 'Failed to start impersonation session', detail: verify.error?.message || 'No session returned' },
      { status: 500 }
    )
  }

  // 3) Set SSR cookies for the browser (so /dashboard sees a real session)
  const supabaseSsr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options, secure })
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options, secure })
      },
    },
  })

  await supabaseSsr.auth.setSession({
    access_token: verify.data.session.access_token,
    refresh_token: verify.data.session.refresh_token!,
  })

  // Track impersonation state (for future banner/return-to-admin UX)
  response.cookies.set({
    name: 'fx_admin_impersonation',
    value: JSON.stringify({ shopId: shop.id, shopName: shop.name, adminId: admin.id, startedAt: new Date().toISOString() }),
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.impersonate_start',
      targetType: 'shop',
      targetId: shop.id,
      description: `Impersonation started for ${shop.name}`,
      metadata: { shopUserId: owner.id, ownerEmail: owner.email },
      request,
    })
  } catch {}

  return response
}


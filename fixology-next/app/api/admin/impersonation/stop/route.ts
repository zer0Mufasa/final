import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secure = request.nextUrl.protocol === 'https:'
  let response = NextResponse.json({ ok: true })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set({ name, value, ...options, secure })
        })
      },
    },
  })

  try {
    await supabase.auth.signOut()
  } catch {}

  response.cookies.set({
    name: 'fx_admin_impersonation',
    value: '',
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.impersonate_stop',
      targetType: 'shop',
      targetId: null,
      description: 'Impersonation stopped',
      request,
    })
  } catch {}

  return response
}


import { NextResponse } from 'next/server'
import { loginPlatformAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const ct = request.headers.get('content-type') || ''

  let email = ''
  let password = ''

  // Be tolerant here: middleware + fetch clients sometimes produce surprising bodies in dev.
  if (ct.includes('application/json')) {
    const raw = await request.text().catch(() => '')
    try {
      const body = raw ? JSON.parse(raw) : null
      email = typeof body?.email === 'string' ? body.email : ''
      password = typeof body?.password === 'string' ? body.password : ''
    } catch {
      email = ''
      password = ''
    }
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null)
    email = typeof form?.get('email') === 'string' ? String(form?.get('email')) : ''
    password = typeof form?.get('password') === 'string' ? String(form?.get('password')) : ''
  } else {
    // fallback attempt
    const raw = await request.text().catch(() => '')
    try {
      const body = raw ? JSON.parse(raw) : null
      email = typeof body?.email === 'string' ? body.email : ''
      password = typeof body?.password === 'string' ? body.password : ''
    } catch {
      email = ''
      password = ''
    }
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const result = await loginPlatformAdmin(email, password)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  // Audit: admin login
  try {
    await logAdminAction({
      adminId: result.admin.id,
      action: 'admin.login',
      targetType: 'admin',
      targetId: result.admin.id,
      description: 'Admin logged in',
      request,
    })
  } catch {
    // Never block login due to audit log failures.
  }

  const response = NextResponse.json({ admin: result.admin }, { status: 200 })
  response.cookies.set({
    name: 'admin_token',
    value: result.token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}


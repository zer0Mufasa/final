import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin/auth'

export async function GET() {
  const token = cookies().get('admin_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const claims = await verifyAdminToken(token)
  if (!claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ admin: claims })
}


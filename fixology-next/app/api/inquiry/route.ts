import { NextRequest } from 'next/server'
import { handleContact } from '../contact/_handler'

export const runtime = 'nodejs'

// Legacy endpoint kept for compatibility with older clients.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  return handleContact(request, {
    type: 'inquiry',
    fullName: body?.fullName ?? body?.name,
    email: body?.email,
    phone: body?.phone,
    shopName: body?.shopName,
    message: body?.message,
    source: body?.source ?? 'legacy:/api/inquiry',
    honey: body?.honey,
  })
}


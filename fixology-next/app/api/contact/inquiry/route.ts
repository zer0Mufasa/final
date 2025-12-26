import { NextRequest } from 'next/server'
import { handleContact } from '../_handler'

export const runtime = 'nodejs'

// Backwards-compatible endpoint: maps old payload into unified /api/contact handler.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const shopName = typeof body?.shopName === 'string' ? body.shopName.trim() : ''

  return handleContact(request, {
    type: 'inquiry',
    fullName: name,
    email,
    phone: phone || undefined,
    shopName: shopName || undefined,
    message,
    source: 'homepage',
    honey: body?.honey,
  })
}


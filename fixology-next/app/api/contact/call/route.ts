import { NextRequest } from 'next/server'
import { handleContact } from '../_handler'

export const runtime = 'nodejs'

// Backwards-compatible endpoint: maps old payload into unified /api/contact handler.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const shopName = typeof body?.shopName === 'string' ? body.shopName.trim() : ''

  const date = typeof body?.date === 'string' ? body.date.trim() : ''
  const time = typeof body?.time === 'string' ? body.time.trim() : ''
  const timezone =
    typeof body?.timezone === 'string'
      ? body.timezone.trim()
      : typeof body?.tz === 'string'
        ? body.tz.trim()
        : ''

  const combinedDate = [date, time].filter(Boolean).join(' ')
  const dateWithTz = [combinedDate, timezone ? `(${timezone})` : ''].filter(Boolean).join(' ')

  return handleContact(request, {
    type: 'call',
    fullName: name,
    email,
    phone,
    shopName: shopName || undefined,
    date: dateWithTz || undefined,
    source: 'homepage',
    honey: body?.honey,
  })
}


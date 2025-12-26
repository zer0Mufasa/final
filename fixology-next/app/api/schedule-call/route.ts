import { NextRequest } from 'next/server'
import { handleContact } from '../contact/_handler'

export const runtime = 'nodejs'

// Legacy endpoint kept for compatibility with older clients.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  const dateISO = typeof body?.dateISO === 'string' ? body.dateISO.trim() : ''
  const timeLabel = typeof body?.timeLabel === 'string' ? body.timeLabel.trim() : ''
  const tz = typeof body?.tz === 'string' ? body.tz.trim() : ''
  const date = [dateISO, timeLabel].filter(Boolean).join(' ')
  const dateWithTz = [date, tz ? `(${tz})` : ''].filter(Boolean).join(' ')

  return handleContact(request, {
    type: 'call',
    fullName: body?.fullName ?? body?.name,
    email: body?.email,
    phone: body?.phone,
    shopName: body?.shopName,
    date: dateWithTz || undefined,
    source: body?.source ?? 'legacy:/api/schedule-call',
    honey: body?.honey,
  })
}


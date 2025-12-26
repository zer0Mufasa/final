import { NextRequest, NextResponse } from 'next/server'

// Form endpoint used by the marketing homepage.
// Intentionally avoids optional deps like `nodemailer` to prevent Vercel build failures.

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)
const isValidPhone = (phone: string) => phone.replace(/\D/g, '').length >= 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Honeypot: if filled, pretend success (bot).
    const honey = typeof body?.honey === 'string' ? body.honey.trim() : ''
    if (honey) {
      return NextResponse.json({ ok: true, spam: true })
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
    const date = typeof body?.date === 'string' ? body.date.trim() : ''
    const time = typeof body?.time === 'string' ? body.time.trim() : ''
    const timezone =
      typeof body?.timezone === 'string' ? body.timezone.trim() : typeof body?.tz === 'string' ? body.tz.trim() : ''

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Name is required.' }, { status: 400 })
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Valid email is required.' }, { status: 400 })
    }
    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'Valid phone is required.' }, { status: 400 })
    }
    if (!date || !time) {
      return NextResponse.json({ ok: false, error: 'Date and time are required.' }, { status: 400 })
    }
    if (!timezone) {
      return NextResponse.json({ ok: false, error: 'Timezone is required.' }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      fallback: true,
      message: 'Call request received. Please email repair@fixologyai.com to confirm.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to submit call request.' },
      { status: 500 }
    )
  }
}


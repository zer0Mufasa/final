import { NextRequest, NextResponse } from 'next/server'

// Form endpoint used by the marketing homepage.
// Intentionally avoids optional deps like `nodemailer` to prevent Vercel build failures.

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
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: name, email, message.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      fallback: true,
      message: 'Inquiry received. Email service not configured; please contact repair@fixologyai.com.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to submit inquiry.' },
      { status: 500 }
    )
  }
}


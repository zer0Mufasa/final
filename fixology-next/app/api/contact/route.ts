import { NextRequest, NextResponse } from 'next/server'

// NOTE:
// Vercel builds can fail if we reference optional deps like `nodemailer`
// without installing them. This endpoint intentionally avoids importing
// nodemailer and returns a safe fallback response.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: name, email, message.' },
        { status: 400 }
      )
    }

    // Fallback (no email provider configured in this repo)
    return NextResponse.json({
      ok: true,
      fallback: true,
      message: 'Email service not configured. Please use repair@fixologyai.com.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to submit contact request.' },
      { status: 500 }
    )
  }
}


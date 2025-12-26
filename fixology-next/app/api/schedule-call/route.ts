import { NextRequest, NextResponse } from 'next/server'

// Legacy endpoint kept for compatibility with older deployments.
// Intentionally does NOT import nodemailer (avoids Vercel build failures).

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const dateISO = typeof body?.dateISO === 'string' ? body.dateISO.trim() : ''
    const timeLabel = typeof body?.timeLabel === 'string' ? body.timeLabel.trim() : ''
    const tz = typeof body?.tz === 'string' ? body.tz.trim() : ''

    if (!name || !dateISO || !timeLabel || !tz) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: name, dateISO, timeLabel, tz.' },
        { status: 400 }
      )
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


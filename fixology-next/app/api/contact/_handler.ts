import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

type ContactType = 'inquiry' | 'call'

export type ContactPayload = {
  type: ContactType
  fullName: string
  email: string
  phone?: string
  shopName?: string
  message?: string
  date?: string
  source?: string

  // optional honeypot (ignored by UI, used to silently drop bots)
  honey?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __fixologyContactRateLimit:
    | Map<string, { count: number; resetAt: number }>
    | undefined
}

const rateLimit =
  globalThis.__fixologyContactRateLimit ??
  new Map<string, { count: number; resetAt: number }>()
globalThis.__fixologyContactRateLimit = rateLimit

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

const emailLooksValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const phoneLooksValid = (phone: string) => phone.replace(/\D/g, '').length >= 10

function countLinks(text: string): number {
  const matches = text.match(/\bhttps?:\/\/\S+|\bwww\.\S+/gi)
  return matches?.length ?? 0
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  const directIp = (req as any).ip as string | undefined
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    directIp ||
    'unknown'
  )
}

function rateLimitCheck(ip: string) {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || entry.resetAt <= now) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true as const }
  }

  if (entry.count >= MAX_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    return { ok: false as const, retryAfterSeconds }
  }

  entry.count += 1
  rateLimit.set(ip, entry)
  return { ok: true as const }
}

function normalizePayload(body: any): ContactPayload | null {
  const type = body?.type
  const fullName =
    typeof body?.fullName === 'string'
      ? body.fullName.trim()
      : typeof body?.name === 'string'
        ? body.name.trim()
        : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined
  const shopName =
    typeof body?.shopName === 'string' ? body.shopName.trim() : undefined
  const message =
    typeof body?.message === 'string' ? body.message.trim() : undefined
  const date = typeof body?.date === 'string' ? body.date.trim() : undefined
  const source =
    typeof body?.source === 'string' ? body.source.trim() : undefined
  const honey = typeof body?.honey === 'string' ? body.honey.trim() : undefined

  if (type !== 'inquiry' && type !== 'call') return null

  return {
    type,
    fullName,
    email,
    phone,
    shopName,
    message,
    date,
    source,
    honey,
  }
}

function internalEmailText(params: {
  payload: ContactPayload
  ip: string
  userAgent: string
  timestamp: string
}) {
  const { payload, ip, userAgent, timestamp } = params
  return [
    `Type: ${payload.type}`,
    `Full name: ${payload.fullName || '(missing)'}`,
    `Email: ${payload.email || '(missing)'}`,
    `Phone: ${payload.phone || '(none)'}`,
    `Shop name: ${payload.shopName || '(no shop)'}`,
    `Date: ${payload.date || '(none)'}`,
    `Source: ${payload.source || '(unknown)'}`,
    '',
    'Message:',
    payload.message || '(none)',
    '',
    `IP: ${ip}`,
    `User-Agent: ${userAgent || '(none)'}`,
    `Timestamp: ${timestamp}`,
  ].join('\n')
}

function internalEmailHtml(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; white-space: pre-wrap; line-height: 1.5">${escaped}</pre>`
}

function confirmationHtml(params: { payload: ContactPayload }) {
  const { payload } = params
  const title =
    payload.type === 'call' ? 'call request' : 'inquiry'
  const name = payload.fullName || 'there'
  const summaryLines =
    payload.type === 'call'
      ? [
          payload.date ? `Preferred time: ${payload.date}` : null,
          payload.phone ? `Phone: ${payload.phone}` : null,
          payload.shopName ? `Shop: ${payload.shopName}` : null,
        ].filter(Boolean)
      : [
          payload.shopName ? `Shop: ${payload.shopName}` : null,
          payload.message ? `Message: ${payload.message}` : null,
        ].filter(Boolean)

  const summary = summaryLines.length
    ? `<div style="margin-top:16px;padding:12px 14px;border:1px solid rgba(0,0,0,0.08);border-radius:12px;background:#fafafa">
         <div style="font-weight:600;margin-bottom:8px">Summary</div>
         <div style="white-space:pre-wrap;line-height:1.55">${summaryLines
           .map((l) => String(l).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
           .join('<br/>')}</div>
       </div>`
    : ''

  return `
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="margin:0 0 8px;font-size:18px">We received your ${title} — Fixology</h2>
      <p style="margin:0;color:#444;line-height:1.6">Hi ${name},</p>
      <p style="margin:12px 0 0;color:#444;line-height:1.6">
        Got it. Check your email. A Fixology team member will follow up within 1 business day.
      </p>
      ${summary}
      <p style="margin:16px 0 0;color:#666;font-size:13px;line-height:1.6">
        If you need to add details, just reply to this email.
      </p>
      <hr style="margin:20px 0;border:none;border-top:1px solid rgba(0,0,0,0.08)"/>
      <p style="margin:0;color:#888;font-size:12px">Fixology</p>
    </div>
  `
}

export async function handleContact(request: NextRequest, body: any) {
  const payload = normalizePayload(body)
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload. Missing/invalid `type`.' },
      { status: 400 }
    )
  }

  // Honeypot: if filled, pretend success (bot).
  if (payload.honey) {
    return NextResponse.json({ ok: true, spam: true })
  }

  const ip = getClientIp(request)
  const rl = rateLimitCheck(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    )
  }

  if (!payload.fullName) {
    return NextResponse.json({ ok: false, error: 'fullName is required.' }, { status: 400 })
  }
  if (!payload.email || !emailLooksValid(payload.email)) {
    return NextResponse.json({ ok: false, error: 'Valid email is required.' }, { status: 400 })
  }

  if (payload.type === 'inquiry') {
    if (!payload.message) {
      return NextResponse.json({ ok: false, error: 'message is required for inquiry.' }, { status: 400 })
    }
  } else {
    if (!payload.phone || !phoneLooksValid(payload.phone)) {
      return NextResponse.json({ ok: false, error: 'Valid phone is required for call requests.' }, { status: 400 })
    }
  }

  const spamText = [payload.message, payload.shopName, payload.fullName].filter(Boolean).join('\n')
  if (spamText && countLinks(spamText) > 2) {
    return NextResponse.json({ ok: false, error: 'Message rejected (spam detected).' }, { status: 400 })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const CONTACT_TO = process.env.CONTACT_TO
  const CONTACT_FROM = process.env.CONTACT_FROM
  const CONTACT_REPLYTO = process.env.CONTACT_REPLYTO

  if (!RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Email service not configured (RESEND_API_KEY missing).' }, { status: 500 })
  }
  if (!CONTACT_TO) {
    return NextResponse.json({ ok: false, error: 'Email service not configured (CONTACT_TO missing).' }, { status: 500 })
  }
  if (!CONTACT_FROM) {
    return NextResponse.json({ ok: false, error: 'Email service not configured (CONTACT_FROM missing).' }, { status: 500 })
  }

  const resend = new Resend(RESEND_API_KEY)

  const userAgent = request.headers.get('user-agent') || ''
  const timestamp = new Date().toISOString()

  const subject = `Fixology ${payload.type}: ${payload.fullName} (${payload.shopName || 'no shop'})`
  const text = internalEmailText({ payload, ip, userAgent, timestamp })

  try {
    // 1) Internal email to you (full details)
    await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: payload.email || CONTACT_REPLYTO || CONTACT_TO,
      subject,
      text,
      html: internalEmailHtml(text),
    })

    // 2) Confirmation email to customer
    await resend.emails.send({
      from: CONTACT_FROM,
      to: payload.email,
      replyTo: CONTACT_REPLYTO || CONTACT_TO,
      subject:
        payload.type === 'call'
          ? 'We received your call request — Fixology'
          : 'We received your inquiry — Fixology',
      html: confirmationHtml({ payload }),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to send email.' },
      { status: 500 }
    )
  }
}

export async function handleContactPost(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return handleContact(request, body)
}



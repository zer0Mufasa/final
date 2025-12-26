import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

type SaveBody = {
  step?: number
  shop?: {
    name?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    timezone?: string
  }
  repairFocus?: string[]
  businessHours?: any
  messaging?: {
    emailUpdates?: boolean
    smsUpdates?: boolean
  }
  team?: {
    techEmail?: string
  }
}

function cleanString(v: unknown) {
  return typeof v === 'string' ? v.trim() : ''
}

function asBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v
  return undefined
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
  return out
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ ok: false, error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ ok: false, error: 'Shop user required' }, { status: 403 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as SaveBody
    const step = typeof body.step === 'number' ? Math.min(5, Math.max(1, body.step)) : undefined

    const shopPatch = body.shop ?? {}
    const name = cleanString(shopPatch.name)
    const phone = cleanString(shopPatch.phone)
    const address = cleanString(shopPatch.address)
    const city = cleanString(shopPatch.city)
    const state = cleanString(shopPatch.state)
    const zip = cleanString(shopPatch.zip)
    const timezone = cleanString(shopPatch.timezone)

    const repairFocus = asStringArray(body.repairFocus)
    const businessHours = body.businessHours ?? undefined

    const emailUpdates = asBool(body.messaging?.emailUpdates)
    const smsUpdates = asBool(body.messaging?.smsUpdates)

    const techEmail = cleanString(body.team?.techEmail)

    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { id: true, features: true },
    })

    if (!shop) {
      return NextResponse.json({ ok: false, error: 'Shop not found' }, { status: 404 })
    }

    const features = (shop.features ?? {}) as any
    const nextFeatures: any = { ...features }
    if (typeof step === 'number') nextFeatures.onboarding_step = step
    if (typeof emailUpdates === 'boolean') nextFeatures.email_updates = emailUpdates
    if (typeof smsUpdates === 'boolean') nextFeatures.sms_updates = smsUpdates

    // Optional: record invite email (even if invite flow is not fully built yet)
    if (techEmail) {
      nextFeatures.pending_tech_invite = techEmail
    }

    // Best-effort: create an INVITED shop user for tech email (no Supabase auth yet)
    if (techEmail) {
      const existing = await prisma.shopUser.findFirst({
        where: { shopId: context.shopId, email: techEmail },
        select: { id: true },
      })

      if (!existing) {
        const randomPassword = `invite-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const passwordHash = await bcrypt.hash(randomPassword, 10)
        await prisma.shopUser.create({
          data: {
            shopId: context.shopId,
            email: techEmail,
            passwordHash,
            name: 'Invited Technician',
            role: 'TECHNICIAN',
            status: 'INVITED',
          },
        })
      }
    }

    const data: any = {
      features: nextFeatures,
    }

    if (name) data.name = name
    if (phone) data.phone = phone
    if (address) data.address = address
    if (city) data.city = city
    if (state) data.state = state
    if (zip) data.zip = zip
    if (timezone) data.timezone = timezone
    if (repairFocus) data.repairFocus = repairFocus
    if (businessHours) data.businessHours = businessHours

    await prisma.shop.update({
      where: { id: context.shopId },
      data,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Onboarding save error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}



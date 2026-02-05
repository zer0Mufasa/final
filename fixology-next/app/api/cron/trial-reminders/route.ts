import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { sendTrialEndingEmail, sendTrialEndedEmail } from '@/lib/email/send'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization') || ''
  if (!secret) return { ok: false as const, status: 500, error: 'CRON_SECRET not configured' }
  if (authHeader !== `Bearer ${secret}`) return { ok: false as const, status: 401, error: 'Unauthorized' }
  return { ok: true as const }
}

function readFeatures(obj: any) {
  return obj && typeof obj === 'object' ? obj : {}
}

export async function GET(req: Request) {
  const auth = requireCronAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Trials ending soon
  const endingSoon = await prisma.shop.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    select: { id: true, name: true, trialEndsAt: true, features: true },
    take: 500,
  })

  let reminded = 0
  for (const shop of endingSoon) {
    const features = readFeatures(shop.features)
    if (features.trialReminder3DaySentAt) continue

    const owner = await prisma.shopUser.findFirst({
      where: { shopId: shop.id, role: 'OWNER' },
      select: { email: true, name: true },
    })
    if (!owner?.email) continue

    const ticketsCreated = await prisma.ticket.count({ where: { shopId: shop.id } }).catch(() => 0)

    await sendTrialEndingEmail(owner.email, {
      shopName: shop.name,
      ownerName: owner.name,
      daysLeft: 3,
      ticketsCreated,
      billingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fixologyai.com'}/settings/billing`,
    }).catch(() => null)

    await prisma.shop.update({
      where: { id: shop.id },
      data: { features: { ...features, trialReminder3DaySentAt: new Date().toISOString() } },
    })

    reminded++
  }

  // Trials expired
  const expired = await prisma.shop.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lt: now },
    },
    select: { id: true, name: true, trialEndsAt: true, features: true },
    take: 500,
  })

  let ended = 0
  for (const shop of expired) {
    const features = readFeatures(shop.features)
    if (features.trialEndedSentAt) continue

    const owner = await prisma.shopUser.findFirst({
      where: { shopId: shop.id, role: 'OWNER' },
      select: { email: true, name: true },
    })
    if (!owner?.email) continue

    await sendTrialEndedEmail(owner.email, {
      shopName: shop.name,
      ownerName: owner.name,
      billingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fixologyai.com'}/settings/billing`,
    }).catch(() => null)

    await prisma.shop.update({
      where: { id: shop.id },
      data: { features: { ...features, trialEndedSentAt: new Date().toISOString() } },
    })

    ended++
  }

  return NextResponse.json({
    ok: true,
    reminded,
    ended,
    scanned: { endingSoon: endingSoon.length, expired: expired.length },
    timestamp: new Date().toISOString(),
  })
}


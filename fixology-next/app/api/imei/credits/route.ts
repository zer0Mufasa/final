// app/api/imei/credits/route.ts
// IMEI Credits API - Get and manage credits for deep scans

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

function isDemo(request: NextRequest) {
  const demoHeader = request.headers.get('x-fx-demo') === '1'
  const demoQuery = request.nextUrl.searchParams.get('demo') === '1'
  const demoCookie = request.cookies.get('fx_demo')?.value === '1'
  return demoHeader || demoQuery || demoCookie
}

const DEMO_CREDITS = 5

async function hasImeiCreditsColumn() {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shops' AND column_name='imei_credits' LIMIT 1`
  )) as any[]
  return !!rows?.length
}

export async function GET(request: NextRequest) {
  try {
    if (isDemo(request)) {
      return NextResponse.json({ credits: DEMO_CREDITS, enabled: false, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get shop for this user
    const shopUser = await prisma.shopUser.findFirst({
      where: { email: user.email },
      include: { shop: { select: { id: true } } },
    })

    if (!shopUser?.shop?.id) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const enabled = await hasImeiCreditsColumn()
    if (!enabled) {
      return NextResponse.json({ credits: 0, enabled: false })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopUser.shop.id },
      select: { imeiCredits: true },
    })

    return NextResponse.json({
      credits: shop?.imeiCredits || 0,
      enabled: true,
    })
  } catch (error: any) {
    console.error('IMEI Credits Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to get credits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isDemo(request)) {
      // In demo mode we don't mutate real data; just return static credits.
      return NextResponse.json({ credits: DEMO_CREDITS, demo: true })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { amount?: number; action?: 'add' | 'deduct' }
    const { amount = 0, action = 'add' } = body

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get shop for this user
    const shopUser = await prisma.shopUser.findFirst({
      where: { email: user.email },
      include: { shop: { select: { id: true } } },
    })

    if (!shopUser?.shop?.id) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const enabled = await hasImeiCreditsColumn()
    if (!enabled) {
      return NextResponse.json(
        { error: 'Credits system is not enabled on the database yet. Apply migrations and retry.', enabled: false },
        { status: 503 }
      )
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopUser.shop.id },
      select: { imeiCredits: true },
    })

    const currentCredits = shop?.imeiCredits || 0

    if (action === 'deduct') {
      if (currentCredits < amount) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
      }
      const newCredits = currentCredits - amount
      await prisma.shop.update({
        where: { id: shopUser.shop.id },
        data: { imeiCredits: newCredits },
      })
      return NextResponse.json({ credits: newCredits })
    } else {
      // Add credits (for purchasing)
      const newCredits = currentCredits + amount
      await prisma.shop.update({
        where: { id: shopUser.shop.id },
        data: { imeiCredits: newCredits },
      })
      return NextResponse.json({ credits: newCredits })
    }
  } catch (error: any) {
    console.error('IMEI Credits Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update credits' }, { status: 500 })
  }
}

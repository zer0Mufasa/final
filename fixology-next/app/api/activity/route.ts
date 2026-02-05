import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

type DemoState = {
  activity?: any[]
}

function isDemo(req: NextRequest) {
  return req.cookies.get('fx_demo')?.value === '1'
}

function readDemoState(req: NextRequest): DemoState {
  try {
    const raw = req.cookies.get('fx_demo_state')?.value
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as DemoState) : {}
  } catch {
    return {}
  }
}

export async function GET(_request: NextRequest) {
  if (isDemo(_request)) {
    const state = readDemoState(_request)
    const events = Array.isArray(state.activity) ? state.activity : []
    return NextResponse.json({ events })
  }

  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })

    const features = (shop?.features as any) || {}
    const events = Array.isArray(features.activityLog) ? features.activityLog : []

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Failed to fetch activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}


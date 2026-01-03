import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

function readFeaturesEstimates(features: any) {
  const arr = features?.estimates
  return Array.isArray(arr) ? arr : []
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const estimates = readFeaturesEstimates(features)
    const estimate = estimates.find((e: any) => e?.id === params.id)
    if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    return NextResponse.json({ estimate }, { status: 200 })
  } catch (error: any) {
    console.error('Estimate GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch estimate' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()

    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const estimates = readFeaturesEstimates(features)
    const idx = estimates.findIndex((e: any) => e?.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    const current = estimates[idx]
    const next: any = { ...current, updatedAt: new Date().toISOString() }

    if (body?.status != null) {
      next.status = String(body.status) as EstimateStatus
      if (next.status === 'approved') next.approvedAt = new Date().toISOString()
      if (next.status === 'declined') next.declinedAt = new Date().toISOString()
    }
    if (body?.declineReason != null) next.declineReason = String(body.declineReason)
    if (body?.validUntil != null) next.validUntil = new Date(body.validUntil).toISOString()
    if (body?.notes != null) next.notes = String(body.notes)

    const updated = [...estimates]
    updated[idx] = next

    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, estimates: updated } },
    })

    return NextResponse.json({ success: true, estimate: next }, { status: 200 })
  } catch (error: any) {
    console.error('Estimate PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update estimate' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const estimates = readFeaturesEstimates(features)
    const nextEstimates = estimates.filter((e: any) => e?.id !== params.id)

    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, estimates: nextEstimates } },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Estimate DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete estimate' }, { status: 500 })
  }
}


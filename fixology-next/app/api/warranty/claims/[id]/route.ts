import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

type WarrantyClaimStatus = 'pending' | 'approved' | 'denied' | 'completed'

function readClaims(features: any) {
  const arr = features?.warrantyClaims
  return Array.isArray(arr) ? arr : []
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
    const claims = readClaims(features)
    const idx = claims.findIndex((c: any) => c?.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })

    const current = claims[idx]
    const next: any = { ...current, updatedAt: new Date().toISOString() }

    if (body?.status != null) {
      next.status = String(body.status) as WarrantyClaimStatus
      next.reviewedBy = context.user.name || context.user.email || 'Staff'
      next.reviewedAt = new Date().toISOString()
      if (next.status === 'completed') next.resolutionTicketId = next.resolutionTicketId || undefined
    }
    if (body?.reviewNotes != null) next.reviewNotes = String(body.reviewNotes)
    if (body?.resolution != null) next.resolution = String(body.resolution)
    if (body?.resolutionType != null) next.resolutionType = String(body.resolutionType)
    if (body?.resolutionAmount != null) next.resolutionAmount = Number(body.resolutionAmount)

    const updated = [...claims]
    updated[idx] = next

    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, warrantyClaims: updated } },
    })

    return NextResponse.json({ success: true, claim: next }, { status: 200 })
  } catch (error: any) {
    console.error('Warranty claim PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update claim' }, { status: 500 })
  }
}


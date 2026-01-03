import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

function readFeaturesEstimates(features: any) {
  const arr = features?.estimates
  return Array.isArray(arr) ? arr : []
}

function nextEstimateNumber(existing: any[]) {
  const max = existing
    .map((e) => String(e?.estimateNumber || ''))
    .map((s) => {
      const m = s.match(/EST-(\d+)/)
      return m ? Number(m[1]) : 0
    })
    .reduce((a, b) => Math.max(a, b), 0)
  return `EST-${String(max + 1).padStart(4, '0')}`
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
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
    const source = estimates.find((e: any) => e?.id === params.id)
    if (!source) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    const copy = {
      ...source,
      id: crypto.randomUUID(),
      estimateNumber: nextEstimateNumber(estimates),
      status: 'draft',
      approvedAt: undefined,
      approvalSignature: undefined,
      declinedAt: undefined,
      declineReason: undefined,
      convertedToTicketId: undefined,
      convertedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const next = [copy, ...estimates].slice(0, 500)
    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, estimates: next } },
    })

    return NextResponse.json({ success: true, estimate: copy }, { status: 201 })
  } catch (error: any) {
    console.error('Estimate duplicate error:', error)
    return NextResponse.json({ error: error.message || 'Failed to duplicate estimate' }, { status: 500 })
  }
}


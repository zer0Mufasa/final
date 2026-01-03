import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'

function readFeaturesEstimates(features: any) {
  const arr = features?.estimates
  return Array.isArray(arr) ? arr : []
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
    const idx = estimates.findIndex((e: any) => e?.id === params.id)
    if (idx === -1) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    const est = estimates[idx]
    if (est?.convertedToTicketId) {
      return NextResponse.json({ error: 'Estimate already converted' }, { status: 400 })
    }

    // Create a real ticket from the estimate
    const lastTicket = await prisma.ticket.findFirst({
      where: { shopId: context.shopId },
      orderBy: { createdAt: 'desc' },
    })
    const ticketCount = lastTicket ? parseInt(lastTicket.ticketNumber.split('-')[1]) + 1 : 1
    const ticketNumber = `FIX-${ticketCount.toString().padStart(4, '0')}`

    const ticket = await prisma.ticket.create({
      data: {
        shopId: context.shopId,
        ticketNumber,
        customerId: est.customerId,
        deviceType: String(est.deviceType || 'Device'),
        deviceBrand: String(est.deviceType || 'Unknown'),
        deviceModel: String(est.deviceModel || ''),
        issueDescription: String(est.deviceCondition || est.notes || 'Converted from estimate'),
        createdById: context.user.id,
        estimatedCost: est.total ?? null,
        aiDraft: {
          source: 'estimate',
          estimateId: est.id,
          estimateNumber: est.estimateNumber,
          items: est.items,
        },
      },
    })

    const nextEstimate = {
      ...est,
      status: 'converted',
      convertedToTicketId: ticket.id,
      convertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [...estimates]
    updated[idx] = nextEstimate

    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, estimates: updated } },
    })

    return NextResponse.json({ success: true, estimate: nextEstimate, ticketId: ticket.id, ticketNumber }, { status: 200 })
  } catch (error: any) {
    console.error('Estimate convert error:', error)
    return NextResponse.json({ error: error.message || 'Failed to convert estimate' }, { status: 500 })
  }
}


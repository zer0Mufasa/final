import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import crypto from 'crypto'

type WarrantyClaimStatus = 'pending' | 'approved' | 'denied' | 'completed'
type WarrantyType = 'labor' | 'parts' | 'full'
type ResolutionType = 'redo' | 'refund' | 'partial-refund' | 'replacement'

function readClaims(features: any) {
  const arr = features?.warrantyClaims
  return Array.isArray(arr) ? arr : []
}

export async function GET(_request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    return NextResponse.json({ claims: readClaims(features) }, { status: 200 })
  } catch (error: any) {
    console.error('Warranty claims GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch claims' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()
  if (isContextError(context)) return NextResponse.json({ error: context.error }, { status: context.status })
  if (!isShopUser(context)) return NextResponse.json({ error: 'Shop user required' }, { status: 403 })

  try {
    const body = await request.json()
    const ticketNumber = String(body?.ticketNumber || '').trim()
    const claimReason = String(body?.claimReason || '').trim()
    const claimDescription = String(body?.claimDescription || '').trim()
    const resolutionType = (String(body?.resolutionType || 'redo') as ResolutionType) || 'redo'

    if (!ticketNumber) return NextResponse.json({ error: 'ticketNumber is required' }, { status: 400 })
    if (!claimReason) return NextResponse.json({ error: 'claimReason is required' }, { status: 400 })
    if (!claimDescription) return NextResponse.json({ error: 'claimDescription is required' }, { status: 400 })

    const ticket = await prisma.ticket.findFirst({
      where: { shopId: context.shopId, ticketNumber },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true } },
        invoice: true,
      },
    })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    const repairDate = ticket.completedAt || ticket.repairedAt || ticket.createdAt
    const warrantyPeriod = 90
    const warrantyExpires = new Date(new Date(repairDate).getTime() + warrantyPeriod * 86400000).toISOString()
    const warrantyType: WarrantyType = 'full'

    const claim: any = {
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      invoiceId: ticket.invoice?.id ?? undefined,
      customerId: ticket.customer.id,
      customerName: `${ticket.customer.firstName} ${ticket.customer.lastName}`.trim(),
      customerPhone: ticket.customer.phone,
      originalRepairDate: new Date(repairDate).toISOString(),
      originalRepairType: ticket.issueDescription,
      originalTechId: ticket.assignedTo?.id || ticket.createdById,
      originalTechName: ticket.assignedTo?.name || 'Staff',
      originalAmount: ticket.invoice ? Number(ticket.invoice.total) : 0,
      warrantyPeriod,
      warrantyExpires,
      warrantyType,
      claimDate: new Date().toISOString(),
      claimReason,
      claimDescription,
      status: 'pending' as WarrantyClaimStatus,
      resolutionType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const shop = await prisma.shop.findUnique({
      where: { id: context.shopId },
      select: { features: true },
    })
    const features = (shop?.features as any) || {}
    const claims = readClaims(features)
    const next = [claim, ...claims].slice(0, 500)

    await prisma.shop.update({
      where: { id: context.shopId },
      data: { features: { ...features, warrantyClaims: next } },
    })

    return NextResponse.json({ success: true, claim }, { status: 201 })
  } catch (error: any) {
    console.error('Warranty claim POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create claim' }, { status: 500 })
  }
}


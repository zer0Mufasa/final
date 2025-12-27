// app/api/risk/imei/route.ts
// IMEI Risk Check - validates IMEI and checks for blacklist/lock status

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'

const IMEIInputSchema = z.object({
  imei: z.string().regex(/^\d{14,15}$/, 'IMEI must be 14-15 digits'),
  brand: z.string().optional(),
})

// Enhanced risk detection with pattern analysis
async function checkIMEIRisk(
  imei: string, 
  brand?: string,
  shopId?: string,
  customerId?: string
): Promise<{
  status: 'clean' | 'flagged' | 'unknown'
  reasons: string[]
  carrierLock?: boolean
  blacklist?: boolean
  lostMode?: boolean
  confidence: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  flags: string[]
}> {
  // Validate IMEI format
  if (!/^\d{14,15}$/.test(imei)) {
    throw new Error('Invalid IMEI format')
  }

  const flags: string[] = []
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  const reasons: string[] = []

  // Check if IMEI appears in previous tickets (fraud detection)
  if (shopId) {
    const { prisma } = await import('@/lib/prisma/client')
    const previousTickets = await prisma.ticket.findMany({
      where: {
        shopId,
        imei,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        customer: true,
        invoice: true,
      },
    })

    if (previousTickets.length > 0) {
      // Check for unpaid repairs
      const unpaidCount = previousTickets.filter(t => 
        !t.invoice || t.invoice.status !== 'PAID'
      ).length

      if (unpaidCount > 0) {
        flags.push(`IMEI found in ${unpaidCount} unpaid repair${unpaidCount > 1 ? 's' : ''}`)
        riskLevel = 'HIGH'
        reasons.push(`This device has ${unpaidCount} prior unpaid repair${unpaidCount > 1 ? 's' : ''}`)
      }

      // Check for different customers (suspicious)
      if (customerId) {
        const differentCustomers = previousTickets.filter(t => t.customerId !== customerId)
        if (differentCustomers.length > 0) {
          flags.push(`IMEI associated with ${differentCustomers.length} different customer${differentCustomers.length > 1 ? 's' : ''}`)
          riskLevel = 'HIGH'
          reasons.push('Device IMEI appears with multiple different customers - possible fraud')
        }
      }

      // Check for repeat repairs (warranty abuse)
      const recentRepairs = previousTickets.filter(t => {
        const daysSince = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince <= 90
      })

      if (recentRepairs.length >= 3) {
        flags.push(`${recentRepairs.length} repairs in last 90 days`)
        riskLevel = 'MEDIUM'
        reasons.push('Multiple repairs in short timeframe - possible warranty abuse')
      }
    }
  }

  // Phase 1: Pattern-based detection
  // Phase 2: Integrate with CheckMend/IMEIPro/carrier API for actual blacklist/lock status
  
  // For now, return pattern-based results
  const hasRiskFlags = flags.length > 0
  
  return {
    status: hasRiskFlags ? 'flagged' : 'unknown',
    reasons: hasRiskFlags ? reasons : ['IMEI check service not configured - pattern analysis only'],
    confidence: hasRiskFlags ? 70 : 0,
    riskLevel,
    flags,
  }
}

const IMEIRiskInputSchema = z.object({
  imei: z.string().regex(/^\d{14,15}$/, 'IMEI must be 14-15 digits'),
  brand: z.string().optional(),
  ticketId: z.string().optional(),
  customerId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const input = IMEIRiskInputSchema.parse(await request.json())

    const result = await checkIMEIRisk(
      input.imei, 
      input.brand,
      context.shopId,
      input.customerId
    )
    
    // Store risk report if ticketId provided
    if (input.ticketId) {
      const { prisma } = await import('@/lib/prisma/client')
      await prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          riskReport: JSON.parse(JSON.stringify(result)),
        },
      })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('IMEI check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to check IMEI' },
      { status: 500 }
    )
  }
}


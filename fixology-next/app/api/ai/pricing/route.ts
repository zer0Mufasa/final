// app/api/ai/pricing/route.ts
// AI Pricing & Explanation Engine - generates transparent price breakdowns

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const PricingInputSchema = z.object({
  ticketId: z.string().optional(),
  parts: z.array(z.object({
    name: z.string(),
    cost: z.number(),
    quantity: z.number().default(1),
  })),
  laborHours: z.number().default(1),
  laborRate: z.number().default(60),
  warrantyDays: z.number().default(90),
})

// Market pricing benchmarks (simplified - in production, use real market data API)
const MARKET_BENCHMARKS: Record<string, { min: number; max: number; avg: number }> = {
  'LCD Screen': { min: 80, max: 150, avg: 115 },
  'Display Assembly': { min: 100, max: 250, avg: 175 },
  'Battery': { min: 30, max: 80, avg: 55 },
  'Camera Module': { min: 50, max: 150, avg: 100 },
  'Charging Port': { min: 20, max: 60, avg: 40 },
  'Speaker': { min: 15, max: 50, avg: 32 },
}

export async function POST(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const input = PricingInputSchema.parse(await request.json())

    // Calculate totals
    const partsTotal = input.parts.reduce((sum, part) => sum + (part.cost * part.quantity), 0)
    const laborTotal = input.laborHours * input.laborRate
    const total = partsTotal + laborTotal

    // Generate explanation
    const partsBreakdown = input.parts.map(part => {
      const marketData = MARKET_BENCHMARKS[part.name] || { min: part.cost * 0.8, max: part.cost * 1.2, avg: part.cost }
      const isMarketRate = part.cost >= marketData.min && part.cost <= marketData.max
      
      return {
        name: part.name,
        quantity: part.quantity,
        cost: part.cost,
        total: part.cost * part.quantity,
        marketRange: `${marketData.min}-${marketData.max}`,
        marketAverage: marketData.avg,
        isMarketRate,
      }
    })

    // Generate customer-friendly explanation
    const explanation = `Your repair includes:

${partsBreakdown.map(p => 
  `• ${p.name}${p.quantity > 1 ? ` (${p.quantity}x)` : ''}: $${p.total.toFixed(2)} ${p.isMarketRate ? '(market average: $' + p.marketAverage.toFixed(2) + ')' : ''}`
).join('\n')}

• Labor (${input.laborHours} ${input.laborHours === 1 ? 'hour' : 'hours'}): $${laborTotal.toFixed(2)}
• Warranty: ${input.warrantyDays} days included

Total: $${total.toFixed(2)}

${partsBreakdown.some(p => p.isMarketRate) 
  ? 'Parts pricing aligns with market averages for OEM-grade components.' 
  : 'Parts are priced competitively for quality components.'} Labor reflects the complexity and precision required for this repair.`

    // Generate internal margin view
    const partsCost = input.parts.reduce((sum, part) => {
      // Assume 40% margin on parts (adjustable)
      const cost = (part.cost * part.quantity) / 1.4
      return sum + cost
    }, 0)
    
    const margin = total - (partsCost + (input.laborHours * 30)) // Assume $30/hr labor cost
    const marginPercent = (margin / total) * 100

    const internalView = {
      partsCost,
      laborCost: input.laborHours * 30,
      totalCost: partsCost + (input.laborHours * 30),
      revenue: total,
      margin,
      marginPercent: Math.round(marginPercent * 10) / 10,
    }

    const result = {
      breakdown: {
        parts: partsBreakdown,
        labor: {
          hours: input.laborHours,
          rate: input.laborRate,
          total: laborTotal,
        },
        warranty: input.warrantyDays,
        total,
      },
      explanation,
      internalView,
      marketComparison: partsBreakdown.map(p => ({
        part: p.name,
        shopPrice: p.total,
        marketRange: p.marketRange,
        marketAverage: p.marketAverage,
        position: p.isMarketRate ? 'within market range' : p.total > p.marketAverage ? 'above average' : 'below average',
      })),
    }

    // Save to invoice/ticket if ticketId provided
    if (input.ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          shopId: context.shopId,
        },
        include: {
          invoice: true,
        },
      })

      if (ticket?.invoice) {
        await prisma.invoice.update({
          where: { id: ticket.invoice.id },
          data: {
            // Store AI explanation in notes or create a separate field if needed
            notes: ticket.invoice.notes 
              ? `${ticket.invoice.notes}\n\nAI Explanation: ${explanation}`
              : `AI Explanation: ${explanation}`,
          },
        })
      }
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Pricing explanation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate pricing explanation' },
      { status: 500 }
    )
  }
}


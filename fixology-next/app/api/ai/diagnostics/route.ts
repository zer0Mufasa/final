// app/api/ai/diagnostics/route.ts
// AI Diagnostic Engine - analyzes device issues and provides actionable insights

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const DiagnosticsInputSchema = z.object({
  ticketId: z.string().optional(),
  deviceType: z.string(),
  brand: z.string(),
  model: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  issueDescription: z.string(),
})

// Symptom to cause mapping (learned patterns)
const SYMPTOM_PATTERNS: Record<string, { cause: string; confidence: number; tests: string[]; parts: string[]; warnings?: string[] }> = {
  'black screen': {
    cause: 'OLED/LCD display failure',
    confidence: 85,
    tests: ['External display test', 'Backlight test', 'Power button response'],
    parts: ['LCD Screen', 'Display Assembly'],
    warnings: ['Face ID may fail after screen replacement'],
  },
  'no image': {
    cause: 'Display panel failure',
    confidence: 80,
    tests: ['External display test', 'Backlight test'],
    parts: ['LCD Screen', 'Display Assembly'],
  },
  'cracked screen': {
    cause: 'Physical damage to display',
    confidence: 95,
    tests: ['Touch response test', 'Display functionality'],
    parts: ['LCD Screen', 'Digitizer', 'Frame'],
  },
  'battery drain': {
    cause: 'Battery degradation or power management issue',
    confidence: 75,
    tests: ['Battery health check', 'Power consumption test', 'Charging port test'],
    parts: ['Battery', 'Charging Port'],
  },
  'won\'t charge': {
    cause: 'Charging port failure or battery issue',
    confidence: 80,
    tests: ['Charging port inspection', 'Battery test', 'Cable test'],
    parts: ['Charging Port', 'Battery'],
  },
  'camera blur': {
    cause: 'Camera module failure or lens damage',
    confidence: 85,
    tests: ['Camera focus test', 'Lens inspection', 'Camera app test'],
    parts: ['Camera Module', 'Rear Camera'],
  },
  'no sound': {
    cause: 'Speaker failure or audio IC issue',
    confidence: 70,
    tests: ['Speaker test', 'Audio output test', 'Headphone jack test'],
    parts: ['Speaker', 'Audio IC'],
  },
  'water damage': {
    cause: 'Liquid exposure causing component failure',
    confidence: 90,
    tests: ['Liquid damage indicator check', 'Component corrosion inspection', 'Power test'],
    parts: ['Multiple components may be affected'],
    warnings: ['Delayed failure possible', 'Warranty may be void'],
  },
  'face id not working': {
    cause: 'Face ID sensor failure or calibration issue',
    confidence: 75,
    tests: ['Face ID calibration', 'Front camera test', 'Proximity sensor test'],
    parts: ['Face ID Module', 'Front Camera'],
    warnings: ['Common after screen replacement', 'May require calibration'],
  },
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
    const input = DiagnosticsInputSchema.parse(await request.json())

    // Get historical ticket data if ticketId provided
    let historicalData: any[] = []
    if (input.ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          shopId: context.shopId,
        },
        include: {
          parts: true,
          notes: true,
        },
      })
      
      if (ticket) {
        // Get similar completed tickets
        historicalData = await prisma.ticket.findMany({
          where: {
            shopId: context.shopId,
            deviceBrand: ticket.deviceBrand,
            deviceType: ticket.deviceType,
            status: { in: ['READY', 'PICKED_UP'] },
          },
          take: 10,
          include: {
            parts: true,
          },
        })
      }
    }

    // Analyze symptoms
    const lowerIssue = input.issueDescription.toLowerCase()
    const symptoms = input.symptoms || []
    const allSymptoms = [...symptoms.map(s => s.toLowerCase()), lowerIssue]

    // Find matching patterns
    const matches: Array<{ cause: string; confidence: number; tests: string[]; parts: string[]; warnings?: string[] }> = []
    
    for (const [pattern, data] of Object.entries(SYMPTOM_PATTERNS)) {
      if (allSymptoms.some(s => s.includes(pattern))) {
        matches.push(data)
      }
    }

    // Calculate most likely cause
    let likelyCause = 'Unknown issue - requires diagnostic'
    let confidence = 0
    let recommendedTests: string[] = []
    let partsSuggestions: string[] = []
    let warnings: string[] = []

    if (matches.length > 0) {
      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence)
      const topMatch = matches[0]
      
      likelyCause = topMatch.cause
      confidence = topMatch.confidence
      recommendedTests = [...new Set(matches.flatMap(m => m.tests))]
      partsSuggestions = [...new Set(matches.flatMap(m => m.parts))]
      warnings = [...new Set(matches.flatMap(m => m.warnings || []))]
    }

    // Adjust confidence based on historical data
    if (historicalData.length > 0) {
      const successRate = historicalData.filter(t => t.status === 'PICKED_UP').length / historicalData.length
      confidence = Math.min(95, confidence + (successRate * 10))
    }

    // Generate repair paths
    const repairPaths = matches.map(match => ({
      approach: match.cause,
      successRate: Math.min(95, match.confidence + 5),
      parts: match.parts,
      estimatedTime: '45-60 minutes',
    }))

    const result = {
      likelyCauses: matches.slice(0, 3).map(m => ({
        cause: m.cause,
        confidence: m.confidence,
      })),
      overallConfidence: confidence,
      primaryCause: likelyCause,
      recommendedTests,
      partsSuggestions,
      repairPaths,
      warnings,
      timeEstimate: '45-90 minutes',
      riskFlags: warnings.length > 0 ? warnings : [],
    }

    // Save to ticket if ticketId provided
    if (input.ticketId) {
      await prisma.ticket.update({
        where: { id: input.ticketId },
        data: {
          diagnosis: JSON.stringify(result),
        },
      })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Diagnostics error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate diagnostics' },
      { status: 500 }
    )
  }
}


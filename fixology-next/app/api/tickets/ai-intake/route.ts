// app/api/tickets/ai-intake/route.ts
// Custom AI-free ticket intake - extracts structured data from plain text using pattern matching

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'
import { parseIntakeText } from '@/lib/ai/intake-parser'

const AIDraftSchema = z.object({
  customer: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  device: z.object({
    brand: z.string(),
    model: z.string().optional(),
    type: z.string(),
    color: z.string().optional(),
  }),
  issue: z.string(),
  noteType: z.enum(['CUSTOMER', 'TECHNICIAN']).default('CUSTOMER'),
  technicianName: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  suggestedParts: z.array(z.string()).default([]),
  estimatedPriceRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  questionsToAsk: z.array(z.string()).default([]),
  confidence: z.object({
    customer: z.number(),
    device: z.number(),
    issue: z.number(),
    overall: z.number(),
  }),
  riskFlags: z.array(z.string()).default([]),
  carrier: z.string().optional(),
  passcode: z.string().optional(),
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
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 })
    }

    // Use custom parser (no OpenAI needed)
    const parsed = parseIntakeText(text)
    
    // Validate with Zod
    const draft = AIDraftSchema.parse(parsed)

    return NextResponse.json({ draft }, { status: 200 })
  } catch (error: any) {
    console.error('AI Intake error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid AI response format', details: error.errors },
        { status: 500 }
      )
    }


    return NextResponse.json(
      { error: error.message || 'Failed to process AI intake' },
      { status: 500 }
    )
  }
}


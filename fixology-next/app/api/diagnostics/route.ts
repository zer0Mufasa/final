// app/api/diagnostics/route.ts
// AI Diagnostics Engine - analyzes device issues and suggests solutions

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { z } from 'zod'
import { createChatCompletion } from '@/lib/ai/novita-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DiagnosticsInputSchema = z.object({
  deviceType: z.string(),
  brand: z.string(),
  model: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  issueDescription: z.string(),
})

const DiagnosticsOutputSchema = z.object({
  likelyCauses: z.array(z.object({
    cause: z.string(),
    confidence: z.number().min(0).max(100),
  })),
  confidence: z.number().min(0).max(100),
  steps: z.array(z.string()),
  partsSuggestions: z.array(z.string()),
  timeEstimate: z.string(),
  riskFlags: z.array(z.string()),
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
    const input = DiagnosticsInputSchema.parse(await request.json())

    const prompt = `Analyze this repair request:
Device: ${input.brand} ${input.model || input.deviceType}
Issue: ${input.issueDescription}
${input.symptoms && input.symptoms.length > 0 ? `Symptoms: ${input.symptoms.join(', ')}` : ''}

Provide a diagnostic analysis with:
1. Likely causes (with confidence %)
2. Overall confidence level
3. Step-by-step diagnostic steps
4. Suggested parts/components needed
5. Estimated repair time
6. Any risk flags (data loss, warranty void, etc.)

Return ONLY valid JSON matching this schema:
{
  "likelyCauses": [{"cause": "string", "confidence": 0-100}],
  "confidence": 0-100,
  "steps": ["step 1", "step 2", ...],
  "partsSuggestions": ["part name 1", "part name 2", ...],
  "timeEstimate": "string (e.g., '2-3 hours')",
  "riskFlags": ["flag 1", "flag 2", ...]
}`

    const completion = await createChatCompletion({
      systemPrompt: 'You are an expert repair technician. Provide accurate, actionable diagnostics.',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: 'json_object',
      temperature: 0.3,
      maxTokens: 1200,
    })

    const rawResult = JSON.parse(completion.content || '{}')
    const result = DiagnosticsOutputSchema.parse(rawResult)

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Diagnostics error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input or AI response format', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message?.includes('NOVITA_API_KEY') || error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate diagnostics' },
      { status: 500 }
    )
  }
}


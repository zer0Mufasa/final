// app/api/ai/panic-log/route.ts
// Novita AI-powered iPhone panic log analysis

import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/ai/novita-client'

const SYSTEM_PROMPT = `You are an expert iPhone repair technician specializing in panic log analysis.

Analyze iPhone panic logs and identify failing components, error codes, and repair recommendations.

Respond with a JSON object in this exact format:
{
  "failingComponent": "string (e.g., 'PMU', 'Baseband', 'NAND', 'MESA')",
  "errorCode": "string (the panic code)",
  "confidence": number (0-100),
  "diagnosis": "string (detailed explanation)",
  "repairSteps": ["array of repair steps"],
  "partsNeeded": ["array of parts"],
  "difficulty": "easy | medium | hard | expert",
  "warnings": ["array of warnings if any"]
}

Common panic codes:
- PMU: Power Management Unit failure
- Baseband: Cellular modem issues
- NAND: Storage failure
- MESA: Face ID sensor failure
- AP: Application Processor issues
- GPU: Graphics processing issues

Be technical and precise. You're talking to repair professionals.`

export async function POST(request: NextRequest) {
  try {
    const { panicLog } = (await request.json()) as { panicLog?: string }
    
    if (!panicLog?.trim()) {
      return NextResponse.json({ error: 'Panic log is required' }, { status: 400 })
    }

    const result = await createChatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze this panic log:\n\n${panicLog}` }],
      maxTokens: 1500,
      temperature: 0.3, // Lower temperature for more precise technical analysis
      responseFormat: 'json_object',
    })

    // Parse JSON response
    let analysis
    try {
      analysis = JSON.parse(result.content)
    } catch {
      // Fallback: try to extract JSON from text
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    return NextResponse.json({
      analysis,
      usage: result.usage,
    })
  } catch (error: any) {
    console.error('Panic Log AI Error:', error)
    
    if (error?.message?.includes('NOVITA_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured. Please add NOVITA_API_KEY to your .env.local file and restart the server.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze panic log' },
      { status: 500 }
    )
  }
}

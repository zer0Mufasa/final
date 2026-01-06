// app/api/ai/quick-intake/route.ts
// Novita AI-powered natural language → structured ticket draft

import { NextRequest, NextResponse } from 'next/server'
import { createChatCompletion } from '@/lib/ai/novita-client'

const SYSTEM_PROMPT = `You are a ticket parser for Fixology, a repair shop management system.

Extract structured data from natural language repair descriptions.

ALWAYS respond with valid JSON in this exact format:
{
  "customer": {
    "name": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "isNew": boolean
  },
  "device": {
    "type": "iPhone | iPad | Samsung | Pixel | Other",
    "model": "string",
    "color": "string or null",
    "storage": "string or null"
  },
  "repair": {
    "issue": "string (main issue)",
    "symptoms": ["array of symptoms"],
    "category": "screen | battery | charging | water | software | other"
  },
  "pricing": {
    "quoted": number or null,
    "deposit": number or null
  },
  "priority": "normal | rush | urgent",
  "notes": "string or null",
  "confidence": number (0-1)
}

Rules:
- If info is missing, use null (or sensible defaults).
- Always include all keys.
- No markdown, no commentary — JSON only.`

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { input } = (await request.json()) as { input?: string }
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    const result = await createChatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
      maxTokens: 1000,
      temperature: 0.7,
      responseFormat: 'json_object',
    })

    const parsed = extractJson(result.content) || JSON.parse(result.content)

    return NextResponse.json({
      result: parsed ?? null,
      raw: result.content,
      usage: result.usage,
    })
  } catch (error: any) {
    console.error('Quick Intake AI Error:', error)
    
    if (error?.message?.includes('NOVITA_API_KEY')) {
      return NextResponse.json(
        { error: 'NOVITA_API_KEY is not configured. Add it in Vercel Environment Variables (Production) and redeploy (or set it in .env.local for local dev).' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quick intake' },
      { status: 500 }
    )
  }
}

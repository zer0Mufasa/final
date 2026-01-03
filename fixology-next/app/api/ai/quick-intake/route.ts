// app/api/ai/quick-intake/route.ts
// Claude-powered natural language → structured ticket draft

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'claude-3-haiku-20240307'

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
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the server.' },
        { status: 500 }
      )
    }

    const { input } = (await request.json()) as { input?: string }
    if (!input?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey })
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    })

    const textPart = resp.content.find((c) => c.type === 'text')
    const raw = textPart?.type === 'text' ? textPart.text : '{}'
    const parsed = extractJson(raw)

    return NextResponse.json({
      result: parsed ?? null,
      raw,
      usage: resp.usage,
    })
  } catch (error: any) {
    console.error('Quick Intake AI Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate quick intake' },
      { status: 500 }
    )
  }
}


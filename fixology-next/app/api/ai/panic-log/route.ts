// app/api/ai/panic-log/route.ts
// Claude-powered iPhone panic log analysis

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'claude-3-haiku-20240307'

const SYSTEM_PROMPT = `You are an expert iPhone panic log analyzer for Fixology repair shops.

Analyze iOS panic logs and kernel crash reports to identify likely failing components and next steps.

Respond ONLY in JSON:
{
  "analysis": {
    "panicType": "string",
    "component": "string",
    "severity": "low | medium | high | critical",
    "confidence": number (0-100)
  },
  "technicalDetails": {
    "panicCode": "string",
    "faultAddress": "string or null",
    "relevantStrings": ["string"]
  },
  "likelyCause": {
    "primary": "string",
    "secondary": ["string"]
  },
  "repair": {
    "recommendation": "string",
    "repairType": "software | component | board-level | replacement",
    "difficulty": "easy | moderate | difficult | microsoldering",
    "canShopFix": boolean,
    "estimatedCost": { "low": number, "high": number }
  },
  "nextSteps": ["string"],
  "customerExplanation": "string",
  "dataRecoveryRisk": "none | low | medium | high"
}

No markdown, no commentary — JSON only.`

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

    const { panicLog, deviceModel } = (await request.json()) as { panicLog?: string; deviceModel?: string }
    if (!panicLog?.trim()) {
      return NextResponse.json({ error: 'panicLog is required' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey })
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Device: ${deviceModel || 'Unknown'}\n\nPanic Log:\n${panicLog}`,
        },
      ],
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
    console.error('Panic Log AI Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze panic log' },
      { status: 500 }
    )
  }
}


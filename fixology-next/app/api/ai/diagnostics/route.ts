// app/api/ai/diagnostics/route.ts
// AI Diagnostic Engine - Chat-based with detailed structured output

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { createChatCompletion } from '@/lib/ai/novita-client'
import {
  getRepairKnowledge,
  extractSearchTerms,
  detectRepairQuestion,
} from '@/lib/repair-wiki'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Give the serverless function enough runway on Vercel.
export const maxDuration = 60

type CacheEntry<T> = { value: T; expiresAt: number }

const DIAGNOSTICS_API_VERSION = '2026-01-07-timeoutfix-v4'

// Module-level caches (persist across requests on warm serverless instances)
const wikiCache = new Map<string, CacheEntry<{ knowledge: string; sources: string[] }>>()
const responseCache = new Map<string, CacheEntry<any>>()

function nowMs() {
  return Date.now()
}

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= nowMs()) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: nowMs() + ttlMs })
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function buildFallbackDiagnosis(userMessage: string) {
  const lower = userMessage.toLowerCase()

  const mk = (summary: string, causes: Array<{ cause: string; likelihood: 'high' | 'medium' | 'low'; explanation: string }>) => {
    return {
      summary,
      confidence: 65,
      possibleCauses: causes,
      diagnosticSteps: [
        { step: 1, title: 'Confirm symptoms', description: 'Reproduce the issue and note exactly when it happens (camera app only? all apps?).', expectedResult: 'Clear symptom pattern.', tools: [] },
        { step: 2, title: 'Visual inspection', description: 'Inspect for cracks, missing glass, debris, or bent frame around the affected area.', expectedResult: 'Damage/debris found or ruled out.', tools: ['flashlight', 'magnifier (optional)'] },
        { step: 3, title: 'Software sanity check', description: 'Restart. Update iOS. Test in Safe Mode-like conditions (no third-party camera apps).', expectedResult: 'If software, issue improves after update/restart.', tools: ['Wi‑Fi'] },
        { step: 4, title: 'Known-good test', description: 'If available, test with known-good camera module / part (shop test part).', expectedResult: 'Symptom changes with known-good part.', tools: ['known-good part (if available)'] },
        { step: 5, title: 'Escalate', description: 'If symptoms persist after part swap, suspect connector/board-level damage.', expectedResult: 'Decision made: parts-level vs board-level.', tools: ['multimeter (optional)', 'microscope (optional)'] },
      ],
      repairGuide: {
        difficulty: 'medium' as const,
        estimatedTime: '30-60 minutes',
        steps: [
          { step: 1, title: 'Power down + prep', description: 'Power off device, remove screws, prep heat to soften adhesive.', warning: 'Use heat carefully; avoid overheating display.' },
          { step: 2, title: 'Open device', description: 'Open device carefully and disconnect battery first.' },
          { step: 3, title: 'Access module', description: 'Remove shields/brackets to access the affected module and connector.' },
          { step: 4, title: 'Inspect connector', description: 'Inspect connector pins for damage, corrosion, or debris.', tip: 'Lightly brush debris; avoid bending pins.' },
          { step: 5, title: 'Replace part', description: 'Replace the suspected faulty module (camera/lens assembly/etc.).' },
          { step: 6, title: 'Re-seat + test', description: 'Re-seat connector(s), reconnect battery, quick test before sealing.' },
          { step: 7, title: 'Seal + reassemble', description: 'Reinstall shields, apply fresh adhesive, close device.' },
          { step: 8, title: 'Final verification', description: 'Test in Camera app + third-party apps; check focus, stabilization, flash.' },
        ],
      },
      partsNeeded: [
        { part: 'Replacement module (device-specific)', compatibility: 'Match exact model + variant', estimatedCost: '$20-$120', supplier: 'OEM/wholesale supplier' },
        { part: 'Adhesive/seal', compatibility: 'Device-specific', estimatedCost: '$5-$15', supplier: 'iFixit/wholesale' },
        { part: 'Tool kit', compatibility: 'Universal', estimatedCost: '$10-$30', supplier: 'iFixit/Amazon' },
      ],
      suggestedPrice: { min: 89, max: 249, laborTime: '45-60 min' },
      commonMistakes: [
        'Not disconnecting the battery before unplugging flex cables',
        'Touching camera lens/sensor with bare fingers',
        'Reusing old adhesive leading to water/dust ingress',
        'Forcing connectors and bending pins',
        'Not test-fitting the camera before sealing the phone',
      ],
      proTips: [
        'Test both Camera app and a third-party app to isolate software vs hardware',
        'Use a microfiber cloth + lens-safe cleaner for camera glass only',
        'If blur is only at certain zoom levels, suspect a specific lens/module',
        'Document pre/post focus behavior for customer notes',
        'Replace seals on any device that’s been opened',
      ],
      warnings: [
        'Disconnect battery before touching any flex cables',
        'Avoid heat near battery; fire risk',
        'Take ESD precautions around camera/logic board',
      ],
    }
  }

  if (lower.includes('camera') || lower.includes('lens') || lower.includes('blurry') || lower.includes('blur')) {
    return mk('Rear camera blur / lens damage (likely optics or camera module issue)', [
      { cause: 'Cracked/misaligned lens glass', likelihood: 'high', explanation: 'Impact can distort optics and cause permanent blur.' },
      { cause: 'Damaged rear camera module (OIS/focus)', likelihood: 'medium', explanation: 'Autofocus/OIS can fail after a drop.' },
      { cause: 'Debris/film on lens', likelihood: 'low', explanation: 'Dust, adhesive residue, or smudge can mimic blur.' },
    ])
  }

  if (lower.includes('face id')) {
    return mk('Face ID failure (sensor/TrueDepth or flex/connector issue)', [
      { cause: 'TrueDepth/front sensor damage', likelihood: 'high', explanation: 'Drop/liquid can break the sensor stack.' },
      { cause: 'Connector/flex issue', likelihood: 'medium', explanation: 'Loose/damaged flex can disable Face ID.' },
      { cause: 'Software/config issue', likelihood: 'low', explanation: 'Rare, but iOS issues can affect setup.' },
    ])
  }

  return mk('Preliminary diagnosis (needs device model + symptom details)', [
    { cause: 'Common parts-level fault', likelihood: 'high', explanation: 'Most issues are parts-level and isolated to a module.' },
    { cause: 'Software/firmware issue', likelihood: 'medium', explanation: 'Updates/restores can resolve intermittent behavior.' },
    { cause: 'Board-level issue', likelihood: 'low', explanation: 'If persists after known-good parts, escalate.' },
  ])
}

const DiagnosticsInputSchema = z.object({
  message: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  // Legacy fields for backward compatibility
  ticketId: z.string().optional(),
  deviceType: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  issueDescription: z.string().optional(),
})

const SYSTEM_PROMPT = `You are Fixology AI, an expert repair technician assistant. You help repair shop technicians diagnose and fix devices.

IMPORTANT: You must respond with a JSON object in this exact format. Do NOT include any text before or after the JSON.

{
  "message": "A brief, friendly summary in plain English (2-3 sentences max)",
  "diagnosis": {
    "summary": "One-line diagnosis (e.g., 'Damaged LCD assembly with possible backlight failure')",
    "confidence": 85,
    "possibleCauses": [
      {
        "cause": "Name of cause",
        "likelihood": "high|medium|low",
        "explanation": "Why this might be the cause, in simple terms"
      }
    ],
    "diagnosticSteps": [
      {
        "step": 1,
        "title": "Short title",
        "description": "Detailed instructions on what to do",
        "expectedResult": "What you should see if this is/isn't the problem",
        "tools": ["tool1", "tool2"]
      }
    ],
    "repairGuide": {
      "difficulty": "easy|medium|hard|expert",
      "estimatedTime": "30-45 minutes",
      "steps": [
        {
          "step": 1,
          "title": "Step title",
          "description": "Detailed repair instructions",
          "tip": "Optional helpful tip",
          "warning": "Optional warning about something dangerous"
        }
      ]
    },
    "partsNeeded": [
      {
        "part": "Part name",
        "compatibility": "Compatible models/versions",
        "estimatedCost": "$XX-$XX",
        "supplier": "Where to get it"
      }
    ],
    "suggestedPrice": {
      "min": 79,
      "max": 129,
      "laborTime": "45 min"
    },
    "commonMistakes": ["Mistake 1", "Mistake 2"],
    "proTips": ["Tip 1", "Tip 2"],
    "warnings": ["Warning 1", "Warning 2"]
  }
}

GUIDELINES:
0. SPEED: Keep text ultra-concise. Each field should be short and scannable.
   - possibleCauses.explanation <= 120 chars
   - diagnosticSteps.description <= 160 chars
   - diagnosticSteps.expectedResult <= 120 chars
   - repairGuide.steps.description <= 160 chars
   - repairGuide.steps.tip/warning <= 120 chars
1. Be SPECIFIC - don't say "check the screen", say "disconnect the display flex cable at connector J4501 and inspect for corrosion or damage"
2. Be PRACTICAL - give steps a real tech can follow right now
3. Include TOOLS needed for each diagnostic step
4. Give REALISTIC price estimates based on typical repair shop rates
5. Difficulty levels:
   - easy: Screen protector, battery replacement, basic cleaning
   - medium: Screen replacement, charging port, speakers
   - hard: Motherboard connectors, water damage, complex disassembly
   - expert: Micro-soldering, BGA work, chip-level repair
6. Always include common mistakes technicians make
7. Include pro tips that save time or improve quality
8. If the issue is unclear, ask a clarifying question in the "message" field instead of guessing

OUTPUT COUNTS (to keep responses fast + scannable):
- possibleCauses: exactly 3 items
- diagnosticSteps: exactly 5 steps (1..5)
- repairGuide.steps: exactly 8 steps (1..8)
- partsNeeded: 3–6 items (include compatibility + cost range)
- commonMistakes: 5 bullets
- proTips: 5 bullets
- warnings: 3 bullets

For panic codes and error codes, reference specific meanings and solutions.
For water damage, always warn about corrosion timeline.
For screen issues, differentiate between LCD, digitizer, and backlight problems.`

export async function POST(request: NextRequest) {
  const isDemoMode =
    request.cookies.get('fx_demo')?.value === '1' ||
    request.headers.get('x-fx-demo') === '1' ||
    request.nextUrl.searchParams.get('demo') === '1'

  const context = await getShopContext(request)
  const shopId = !isContextError(context) && isShopUser(context) ? context.shopId : undefined

  // Demo mode is UI-only (no Supabase session), so allow diagnostics without auth.
  if ((isContextError(context) || !isShopUser(context)) && !isDemoMode) {
    const status = isContextError(context) ? context.status : 403
    const error = isContextError(context) ? context.error : 'Shop user required'
    return NextResponse.json({ error }, { status })
  }

  try {
    // Parse body ourselves so malformed JSON returns 400 (not 500) and doesn't spam logs.
    const rawBody = await request.text()
    let body: unknown
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const input = DiagnosticsInputSchema.parse(body)

    // Support both new chat format and legacy format
    const userMessage = input.message || input.issueDescription || ''
    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'Message or issueDescription is required' },
        { status: 400 }
      )
    }

    // Response cache: identical message + recent context should return instantly.
    const historyKey =
      input.conversationHistory?.slice(-2).map((m) => `${m.role}:${m.content}`).join('|') || ''
    const responseCacheKey = `${userMessage}||${historyKey}`
    const cachedResponse = getFromCache(responseCache, responseCacheKey)
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, { status: 200 })
    }

    // Check if this is a repair-related question and get repair.wiki knowledge
    const isRepairRelated = detectRepairQuestion(userMessage)
    let repairKnowledge = ''
    let sources: string[] = []

    // Only fetch repair.wiki when it’s likely to add high-signal value (reduces latency a lot).
    const lowerMsg = userMessage.toLowerCase()
    const shouldUseWiki =
      isRepairRelated &&
      (/\b(error|panic|kernel|0x[0-9a-f]{4,}|4013|0x[0-9a-f]{4,})\b/.test(lowerMsg) ||
        lowerMsg.includes('audio ic') ||
        lowerMsg.includes('tristar') ||
        lowerMsg.includes('tigris') ||
        lowerMsg.includes('baseband') ||
        lowerMsg.includes('repair.wiki') ||
        lowerMsg.includes('repair wiki'))

    if (shouldUseWiki) {
      try {
        const searchTerms = extractSearchTerms(userMessage)

        // Repair.wiki can be slow; cap it hard and use cache.
        const wikiCacheKey = searchTerms.toLowerCase().trim()
        const cachedWiki = getFromCache(wikiCache, wikiCacheKey)
        const wikiData =
          cachedWiki ||
          (await withTimeout(getRepairKnowledge(searchTerms), 900, 'REPAIR_WIKI'))

        if (!cachedWiki) {
          // Cache wiki knowledge for 6 hours
          setCache(wikiCache, wikiCacheKey, wikiData, 6 * 60 * 60 * 1000)
        }

        // Truncate knowledge aggressively to keep LLM fast.
        repairKnowledge = (wikiData.knowledge || '').slice(0, 1200)
        sources = Array.isArray(wikiData.sources) ? wikiData.sources.slice(0, 3) : []
      } catch (e) {
        // Don't block the response if wiki is slow/down.
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.includes('REPAIR_WIKI_TIMEOUT')) {
          console.error('Repair wiki search failed:', e)
        }
      }
    }

    // Build messages array for AI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (repairKnowledge ? `\n\nREPAIR.WIKI KNOWLEDGE:\n${repairKnowledge}` : ''),
      },
    ]

    // Add conversation history if provided (for chat interface)
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      // Keep last 4 messages to stay fast
      const recentHistory = input.conversationHistory.slice(-4)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    })

    // Call AI with structured JSON output (abortable so Vercel doesn't time out)
    let aiResponse: any
    try {
      const basePrompt = SYSTEM_PROMPT + (repairKnowledge ? `\n\nREPAIR.WIKI KNOWLEDGE:\n${repairKnowledge}` : '')
      const chatMessages = messages
        .slice(1) // skip system prompt (provided separately)
        .filter((m) => m.role !== 'system') as Array<{ role: 'user' | 'assistant'; content: string }>

      const controller = new AbortController()
      const abortTimer = setTimeout(() => controller.abort(), 25000)
      let completion
      try {
        completion = await createChatCompletion({
          systemPrompt: basePrompt,
          messages: chatMessages,
          maxTokens: 1400,
          temperature: 0.15,
          responseFormat: 'json_object',
          model: 'meta-llama/llama-3.3-70b-instruct',
          signal: controller.signal,
        })
      } finally {
        clearTimeout(abortTimer)
      }

      const aiContent = completion.content || ''

      // Parse JSON response
      try {
        // Try to extract JSON from response (in case AI adds extra text)
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in AI response')
        }
      } catch (parseError) {
        console.error('Failed to parse AI JSON response:', parseError)

        // Repair pass: ask the model to output VALID JSON only (fast and reliable).
        const repair = await createChatCompletion({
          systemPrompt:
            'You are a JSON repair tool. Convert the provided content into a VALID JSON object that matches the required schema exactly. ' +
            'Do not include any extra text. If the content is incomplete, infer and fill missing fields with safe defaults.',
          messages: [
            {
              role: 'user',
              content:
                `REQUIRED SCHEMA (return exactly this shape):\n` +
                `{\n` +
                `  "message": string,\n` +
                `  "diagnosis": {\n` +
                `    "summary": string,\n` +
                `    "confidence": number,\n` +
                `    "possibleCauses": Array<{cause: string, likelihood: "high"|"medium"|"low", explanation: string}>,\n` +
                `    "diagnosticSteps": Array<{step: number, title: string, description: string, expectedResult: string, tools?: string[]}>,\n` +
                `    "repairGuide": { difficulty: "easy"|"medium"|"hard"|"expert", estimatedTime: string, steps: Array<{step: number, title: string, description: string, tip?: string, warning?: string}> },\n` +
                `    "partsNeeded": Array<{part: string, compatibility: string, estimatedCost: string, supplier?: string}>,\n` +
                `    "suggestedPrice": { min: number, max: number, laborTime: string },\n` +
                `    "commonMistakes": string[],\n` +
                `    "proTips": string[],\n` +
                `    "warnings": string[]\n` +
                `  }\n` +
                `}\n\n` +
                `CONTENT TO REPAIR:\n${aiContent}`,
            },
          ],
          maxTokens: 1400,
          temperature: 0,
          responseFormat: 'json_object',
          model: 'meta-llama/llama-3.3-70b-instruct',
        })

        const repaired = repair.content || ''
        try {
          const jsonMatch2 = repaired.match(/\{[\s\S]*\}/)
          if (jsonMatch2) {
            aiResponse = JSON.parse(jsonMatch2[0])
          } else {
            throw new Error('No JSON found in repair response')
          }
        } catch (parseError2) {
          console.error('Failed to parse repaired JSON response:', parseError2)
          // Final fallback: return a basic response
          aiResponse = {
            message:
              'I analyzed your issue, but had trouble formatting the response. Please try again with a bit more detail (device + symptoms).',
            diagnosis: null,
          }
        }
      }
    } catch (aiError: any) {
      console.error('AI enhancement error:', aiError)

      // Avoid surfacing errors to the UI; return a structured fallback fast.
      aiResponse = {
        message:
          'Here’s the most likely diagnosis based on your description. If you share device model + what changed (drop/liquid) I can tighten this up.',
        diagnosis: buildFallbackDiagnosis(userMessage),
      }

      // If NOVITA_API_KEY is missing, provide helpful error
      if (aiError?.message?.includes('NOVITA_API_KEY')) {
        aiResponse = {
          message:
            'AI key is not configured, so this is a fallback diagnosis. Add NOVITA_API_KEY to enable full AI diagnostics.',
          diagnosis: buildFallbackDiagnosis(userMessage),
        }
      }
    }

    // Add sources to diagnosis if available
    if (aiResponse.diagnosis && sources.length > 0) {
      aiResponse.diagnosis.sources = sources
    }

    // Ensure all required fields exist with defaults
    if (aiResponse.diagnosis) {
      const diag = aiResponse.diagnosis
      
      // Ensure arrays exist
      if (!Array.isArray(diag.possibleCauses)) diag.possibleCauses = []
      if (!Array.isArray(diag.diagnosticSteps)) diag.diagnosticSteps = []
      if (!Array.isArray(diag.repairGuide?.steps)) diag.repairGuide = { ...diag.repairGuide, steps: [] }
      if (!Array.isArray(diag.partsNeeded)) diag.partsNeeded = []
      if (!Array.isArray(diag.commonMistakes)) diag.commonMistakes = []
      if (!Array.isArray(diag.proTips)) diag.proTips = []
      if (!Array.isArray(diag.warnings)) diag.warnings = []
      
      // Ensure repairGuide exists
      if (!diag.repairGuide) {
        diag.repairGuide = {
          difficulty: 'medium',
          estimatedTime: '45-90 minutes',
          steps: [],
        }
      }
      
      // Ensure suggestedPrice exists
      if (!diag.suggestedPrice) {
        diag.suggestedPrice = {
          min: 50,
          max: 150,
          laborTime: '45 min',
        }
      }
      
      // Ensure confidence is a number
      if (typeof diag.confidence !== 'number') {
        diag.confidence = 75
      }
    }

    // Save to ticket if ticketId provided (legacy support)
    if (shopId && input.ticketId) {
      try {
        await prisma.ticket.update({
          where: { id: input.ticketId },
          data: {
            diagnosis: JSON.stringify(aiResponse),
          },
        })
      } catch (dbError) {
        console.error('Failed to save diagnosis to ticket:', dbError)
        // Don't fail the request if DB save fails
      }
    }

    const payload = {
      message: aiResponse.message || '',
      diagnosis: aiResponse.diagnosis || null,
      sources: sources.length > 0 ? sources : undefined,
      usedRepairWiki: repairKnowledge.length > 0,
      meta: {
        version: DIAGNOSTICS_API_VERSION,
        usedWiki: shouldUseWiki,
      },
    }

    // Cache only successful diagnoses (never cache errors/timeouts).
    if (payload.diagnosis) {
      setCache(responseCache, responseCacheKey, payload, 10 * 60 * 1000)
    }

    return NextResponse.json(payload, { status: 200 })
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

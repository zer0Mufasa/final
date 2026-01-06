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

type CacheEntry<T> = { value: T; expiresAt: number }

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

    if (isRepairRelated) {
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

    // Call AI with structured JSON output
    let aiResponse: any
    try {
      const completion = await withTimeout(
        createChatCompletion({
          systemPrompt: SYSTEM_PROMPT + (repairKnowledge ? `\n\nREPAIR.WIKI KNOWLEDGE:\n${repairKnowledge}` : ''),
          messages: messages.slice(1), // Skip system prompt (already in systemPrompt param)
          // Force smaller output for speed; 70B stays reliable for JSON structure.
          maxTokens: 900,
          temperature: 0.15,
          responseFormat: 'json_object',
          model: 'meta-llama/llama-3.3-70b-instruct',
        }),
        15000,
        'AI'
      )

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
        // Fallback: return a basic response
        aiResponse = {
          message: aiContent || 'I analyzed your issue, but had trouble formatting the response. Please try rephrasing your question.',
          diagnosis: null,
        }
      }
    } catch (aiError: any) {
      console.error('AI enhancement error:', aiError)
      
      // If NOVITA_API_KEY is missing, provide helpful error
      if (aiError?.message?.includes('NOVITA_API_KEY')) {
        return NextResponse.json(
          {
            message: 'AI diagnostics unavailable. Please configure NOVITA_API_KEY in Vercel environment variables.',
            diagnosis: null,
            error: 'API key not configured',
          },
          { status: 500 }
        )
      }

      // Fallback response
      aiResponse = {
        message:
          aiError?.message?.includes('AI_TIMEOUT')
            ? 'This diagnosis is taking longer than expected. I returned a quick preliminary checklist—try again for a deeper analysis.'
            : 'I encountered an error analyzing your issue. Please try again or rephrase your question.',
        diagnosis: aiError?.message?.includes('AI_TIMEOUT')
          ? {
              summary: 'Preliminary diagnostic checklist (quick mode)',
              confidence: 60,
              possibleCauses: [
                { cause: 'Software/firmware issue', likelihood: 'high', explanation: 'Common cause of intermittent behavior and restarts.' },
                { cause: 'Battery/power instability', likelihood: 'medium', explanation: 'Loose connector, weak battery, or power IC instability.' },
                { cause: 'Board-level fault', likelihood: 'low', explanation: 'Less common, but possible if symptoms persist with known-good parts.' },
              ],
              diagnosticSteps: [
                { step: 1, title: 'Reproduce + log', description: 'Note exact trigger (idle/charging/app). Check for crash/panic logs if iOS.', expectedResult: 'Clear pattern or log entry identified.', tools: ['Settings', 'panic log viewer (optional)'] },
                { step: 2, title: 'Isolate peripherals', description: 'Disconnect nonessential flexes (if opened) or remove accessories/case.', expectedResult: 'Symptom changes when a peripheral is removed.', tools: ['Basic tools (if opened)'] },
                { step: 3, title: 'Known-good power path', description: 'Test with known-good battery/cable/charger. Inspect battery connector seating.', expectedResult: 'Stable operation with known-good power path.', tools: ['Known-good charger', 'Known-good battery (optional)'] },
                { step: 4, title: 'Software sanity check', description: 'Update iOS / restore via Finder/iTunes (if applicable).', expectedResult: 'If software was the cause, issue is gone post-restore.', tools: ['Computer', 'Finder/iTunes'] },
                { step: 5, title: 'Escalate', description: 'If persists after restore + known-good battery, treat as board-level and proceed to board diagnostics.', expectedResult: 'Decision made: board-level vs parts-level.', tools: ['Multimeter', 'Microscope (optional)'] },
              ],
              repairGuide: {
                difficulty: 'medium',
                estimatedTime: '30-60 minutes',
                steps: [
                  { step: 1, title: 'Confirm reproducibility', description: 'Verify symptom is consistent and not app-specific.', tip: 'Record a short video for customer documentation.' },
                  { step: 2, title: 'Update/restore', description: 'Update iOS; if needed restore the device.', warning: 'Backup data first.' },
                  { step: 3, title: 'Inspect connectors', description: 'If opened, inspect battery/display flexes for damage/corrosion.', tip: 'Look for lifted pins or debris.' },
                  { step: 4, title: 'Swap known-good battery', description: 'Test with a known-good battery to rule out brownouts.' },
                  { step: 5, title: 'Check for liquid indicators', description: 'Inspect LCI and corrosion hotspots.', warning: 'Corrosion can worsen quickly—clean promptly.' },
                  { step: 6, title: 'Stabilize power path', description: 'Reseat connectors; replace damaged flex/connector if found.' },
                  { step: 7, title: 'Re-test under load', description: 'Run stress test / charging test and observe stability.' },
                  { step: 8, title: 'Escalate to board work', description: 'If still failing, proceed with board-level diagnostics.' },
                ],
              },
              partsNeeded: [
                { part: 'Known-good battery', compatibility: 'Device-specific', estimatedCost: '$15-$60', supplier: 'iFixit / wholesale supplier' },
                { part: 'Charging cable + adapter', compatibility: 'Device-specific', estimatedCost: '$10-$40', supplier: 'OEM/quality aftermarket' },
                { part: 'Basic tool kit', compatibility: 'Universal', estimatedCost: '$10-$30', supplier: 'iFixit / Amazon' },
              ],
              suggestedPrice: { min: 49, max: 129, laborTime: '30-60 min' },
              commonMistakes: [
                'Skipping a restore/update and guessing hardware first',
                'Testing with unknown chargers/cables',
                'Not reseating/inspecting connectors after opening',
                'Not checking for liquid/corrosion early',
                'Not confirming with known-good parts before board work',
              ],
              proTips: [
                'Log when restarts occur (charging, idle, app open) to narrow root cause',
                'Use known-good power accessories for all power-related symptoms',
                'Photograph corrosion and connector damage for customer notes',
                'If panic logs point to a specific sensor/flex, isolate that flex early',
                'After any repair, run a 10–15 min stability test (charge + load)',
              ],
              warnings: [
                'Lithium batteries can be hazardous—avoid puncture/bending',
                'Corrosion can spread—clean and dry ASAP',
                'Board-level repair requires advanced tools and experience',
              ],
            }
          : null,
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
    }

    // Cache final payload for short period to make repeats instant.
    setCache(responseCache, responseCacheKey, payload, 10 * 60 * 1000)

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

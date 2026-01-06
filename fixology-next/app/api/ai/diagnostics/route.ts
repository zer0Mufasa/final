// app/api/ai/diagnostics/route.ts
// AI Diagnostic Engine - analyzes device issues and provides actionable insights

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
  const isDemoMode = request.cookies.get('fx_demo')?.value === '1'
  const context = await getShopContext(request)
  const shopId = !isContextError(context) && isShopUser(context) ? context.shopId : undefined

  // Demo mode is UI-only (no Supabase session), so allow diagnostics without auth.
  if ((isContextError(context) || !isShopUser(context)) && !isDemoMode) {
    const status = isContextError(context) ? context.status : 403
    const error = isContextError(context) ? context.error : 'Shop user required'
    return NextResponse.json({ error }, { status })
  }

  try {
    const input = DiagnosticsInputSchema.parse(await request.json())

    // Get historical ticket data if ticketId provided
    let historicalData: any[] = []
    if (shopId && input.ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: input.ticketId,
          shopId,
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
            shopId,
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
      recommendedTests = Array.from(new Set(matches.flatMap(m => m.tests)))
      partsSuggestions = Array.from(new Set(matches.flatMap(m => m.parts)))
      warnings = Array.from(new Set(matches.flatMap(m => m.warnings || [])))
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

    // Check if this is a repair-related question and get repair.wiki knowledge
    const isRepairRelated = detectRepairQuestion(input.issueDescription)
    let repairKnowledge = ''
    let sources: string[] = []

    if (isRepairRelated) {
      const searchTerms = extractSearchTerms(input.issueDescription)
      const wikiData = await getRepairKnowledge(searchTerms)
      repairKnowledge = wikiData.knowledge
      sources = wikiData.sources
    }

    // Use AI to enhance diagnostics if repair.wiki knowledge is available or if no pattern matches
    let aiEnhancedResult = null
    if (repairKnowledge || matches.length === 0) {
      try {
        const baselineForUnknown = {
          primaryCause: likelyCause || 'Unknown issue - requires diagnostic',
          confidence: confidence || 65,
          recommendedTests:
            recommendedTests.length > 0
              ? recommendedTests
              : [
                  'Pull and review panic logs / analytics',
                  'Inspect for liquid damage indicators and corrosion',
                  'Check battery health + current draw (USB ammeter / DCPS)',
                  'Verify storage is not near full; check for thermal throttling',
                  'Run functional test: cameras, Face ID, charging, speakers, touch',
                ],
          partsSuggestions: partsSuggestions.length > 0 ? partsSuggestions : [],
          warnings: warnings.length > 0 ? warnings : ['May require board-level diagnosis depending on panic code'],
          steps:
            recommendedTests.length > 0
              ? recommendedTests
              : [
                  'Start with panic log signature (e.g., 0x... or 200000/210 codes)',
                  'Correlate with common culprits (power/thermal/sensors/baseband)',
                  'Confirm with targeted isolation tests before swapping parts',
                ],
        }

        const systemPrompt = `You are Fixology AI, an expert repair technician assistant for device repair shop owners and technicians.

Your expertise:
- iPhone/Android phone repair diagnostics
- Panic log and error code analysis
- Component-level troubleshooting (screens, batteries, charging ports, motherboards)
- Repair time and difficulty estimates
- Parts identification and compatibility
- Micro-soldering guidance

When helping:
- Be technical and precise - you're talking to repair professionals
- Reference specific components, tools, and techniques
- If you identify a panic code or error, explain what it means
- Suggest diagnostic steps in order of likelihood
- Mention if something requires micro-soldering vs standard repair
- If repair.wiki knowledge is provided, use it to give accurate answers
- Always cite repair.wiki as a source when using its information

${repairKnowledge ? `\n${repairKnowledge}` : ''}

Analyze the following device issue and provide:
1. Primary cause (most likely issue)
2. Confidence level (0-100)
3. Recommended diagnostic tests/steps
4. Parts that may need replacement
5. Any warnings or risk flags

Device: ${input.deviceType} ${input.brand} ${input.model || ''}
Issue: ${input.issueDescription}
Symptoms: ${symptoms.join(', ') || 'None specified'}

Respond in JSON format:
{
  "primaryCause": "description",
  "confidence": 85,
  "recommendedTests": ["test1", "test2"],
  "partsSuggestions": ["part1", "part2"],
  "warnings": ["warning1"],
  "steps": ["step1", "step2"]
}`

        const aiResponse = await createChatCompletion({
          systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Return ONLY valid JSON. Issue: ${input.issueDescription}`,
            },
          ],
          maxTokens: 2000,
          temperature: 0.5,
          responseFormat: 'json_object',
        })

        try {
          aiEnhancedResult = JSON.parse(aiResponse.content || '{}')
        } catch {
          aiEnhancedResult = baselineForUnknown
        }

        // If Novita returns empty/partial JSON, fill with sensible defaults
        if (!aiEnhancedResult?.primaryCause) aiEnhancedResult.primaryCause = baselineForUnknown.primaryCause
        if (!aiEnhancedResult?.confidence) aiEnhancedResult.confidence = baselineForUnknown.confidence
        if (!Array.isArray(aiEnhancedResult?.recommendedTests) || aiEnhancedResult.recommendedTests.length === 0) {
          aiEnhancedResult.recommendedTests = baselineForUnknown.recommendedTests
        }
        if (!Array.isArray(aiEnhancedResult?.steps) || aiEnhancedResult.steps.length === 0) {
          aiEnhancedResult.steps = baselineForUnknown.steps
        }
        if (!Array.isArray(aiEnhancedResult?.warnings)) aiEnhancedResult.warnings = baselineForUnknown.warnings
        if (!Array.isArray(aiEnhancedResult?.partsSuggestions)) aiEnhancedResult.partsSuggestions = baselineForUnknown.partsSuggestions
      } catch (aiError) {
        console.error('AI enhancement error:', aiError)
        // Fall back to a non-empty baseline so the UI isn't blank (common if NOVITA_API_KEY is missing)
        if (matches.length === 0) {
          aiEnhancedResult = {
            primaryCause: 'Unknown issue - requires diagnostic',
            confidence: 65,
            recommendedTests: [
              'Pull and review panic logs / analytics',
              'Inspect for liquid damage indicators and corrosion',
              'Check battery health + current draw (USB ammeter / DCPS)',
              'Run functional test: cameras, Face ID, charging, speakers, touch',
            ],
            partsSuggestions: [],
            warnings: ['AI enhancement unavailable; verify NOVITA_API_KEY in Vercel env'],
            steps: [
              'Start with panic log signature and isolate likely subsystem',
              'Confirm with targeted tests before replacing parts',
            ],
          }
        }
      }
    }

    // Merge AI results with pattern matching results
    const finalPrimaryCause = aiEnhancedResult?.primaryCause || likelyCause
    const finalConfidenceRaw = aiEnhancedResult?.confidence ?? confidence
    const finalConfidence = Math.max(0, Math.min(100, Number(finalConfidenceRaw) || 0))
    const finalRecommendedTests = aiEnhancedResult?.recommendedTests || recommendedTests
    const finalPartsSuggestions = aiEnhancedResult?.partsSuggestions || partsSuggestions
    const finalWarnings = aiEnhancedResult?.warnings || warnings
    const finalSteps = aiEnhancedResult?.steps || recommendedTests

    const result = {
      likelyCauses: matches.slice(0, 3).map(m => ({
        cause: m.cause,
        confidence: m.confidence,
      })),
      overallConfidence: finalConfidence,
      confidence: finalConfidence,
      primaryCause: finalPrimaryCause,
      recommendedTests: finalRecommendedTests,
      steps: finalSteps,
      partsSuggestions: finalPartsSuggestions,
      repairPaths,
      warnings: finalWarnings,
      timeEstimate: '45-90 minutes',
      riskFlags: finalWarnings.length > 0 ? finalWarnings : [],
      sources: sources.length > 0 ? sources : undefined,
      usedRepairWiki: sources.length > 0,
      demoMode: isDemoMode,
    }

    // Save to ticket if ticketId provided
    if (shopId && input.ticketId) {
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


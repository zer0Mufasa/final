// app/api/imei-check/route.ts
// Legacy compatibility endpoint used by fixology-next/public/js/imei-engine.js
//
// Expected request: { imei: string, mode: 'basic' | 'deep' }
// Expected response: { success: true, imei, mode, ... }
//
// Implementation: calls the newer /api/imei/lookup endpoint and adapts the response.

import { NextRequest, NextResponse } from 'next/server'

type Mode = 'basic' | 'deep'

function toMode(value: unknown): Mode {
  return value === 'deep' ? 'deep' : 'basic'
}

type Blacklist = 'clean' | 'blacklisted' | 'unknown'
type SimLock = 'locked' | 'unlocked' | 'unknown'

function mapBlacklist(status?: string): Blacklist {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s.includes('black')) return 'blacklisted'
  if (s.includes('clean')) return 'clean'
  return 'unknown'
}

function mapSimLock(status?: string): SimLock {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s.includes('unlock')) return 'unlocked'
  if (s.includes('lock')) return 'locked'
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { imei?: string; mode?: Mode }
    const imei = body?.imei?.replace(/[\s-]/g, '') || ''
    const mode = toMode(body?.mode)

    // Support legacy 14-digit inputs in demo/mock mode (the downstream /api/imei/lookup will enforce 15-digit when a real API key is set).
    if (!/^\d{14,15}$/.test(imei)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IMEI format (must be 14-15 digits)' },
        { status: 400 }
      )
    }

    // Delegate to the newer API so we keep one “source of truth”.
    const origin = new URL(request.url).origin
    const lookupResp = await fetch(`${origin}/api/imei/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imei }),
    })

    const lookupJson = await lookupResp.json().catch(() => ({}))
    if (!lookupResp.ok) {
      return NextResponse.json(
        { success: false, error: lookupJson?.error || 'IMEI lookup failed' },
        { status: lookupResp.status }
      )
    }

    // New API shape (our internal format)
    const data = lookupJson as {
      imei: string
      valid: boolean
      deviceInfo?: { brand?: string; model?: string; modelNumber?: string; type?: string }
      carrier?: { name?: string; country?: string; simLock?: string }
      blacklistStatus?: { status?: string }
      iCloud?: { status?: string; fmiEnabled?: boolean }
      warranty?: { status?: string; expiryDate?: string; coverage?: string }
      purchaseDate?: string
      repairCoverage?: boolean
    }

    const blacklist = mapBlacklist(data.blacklistStatus?.status)
    const simLock = mapSimLock(data.carrier?.simLock)

    // Legacy engine expects these fields (but we also include the newer “Cursor prompt” fields)
    const basicResponse = {
      success: true,
      imei: data.imei,
      mode,
      limitedInfo: mode === 'basic',
      device: {
        brand: data.deviceInfo?.brand || 'Unknown',
        model: data.deviceInfo?.model || 'Unknown Device',
        modelNumber: data.deviceInfo?.modelNumber || undefined,
        type: data.deviceInfo?.type || 'Smartphone',
      },
      // “quickStatus” drives the top badge in the legacy UI
      quickStatus: {
        // Cursor prompt fields:
        blacklist,
        simLock,
        // Legacy UI fields:
        color:
          blacklist === 'blacklisted'
            ? 'red'
            : blacklist === 'clean'
              ? 'green'
              : 'yellow',
        message:
          blacklist === 'blacklisted'
            ? 'Blacklisted — do not repair'
            : blacklist === 'clean'
              ? 'Not blacklisted'
              : 'Status unknown',
      },
      security: {
        // Cursor prompt fields:
        stolen: false,
        lost: false,

        // Legacy fields (kept for old engine compatibility):
        blacklistStatus: blacklist === 'clean' ? 'Not Blacklisted' : blacklist === 'blacklisted' ? 'Blacklisted' : 'Unknown',
        carrierLock: simLock === 'locked' ? 'Locked' : simLock === 'unlocked' ? 'Unlocked' : 'Unknown',
        findMyStatus: data.iCloud?.status === 'off' ? 'Off' : data.iCloud?.status === 'on' ? 'On' : 'Unknown',
      },
      network: {
        carrier: data.carrier?.name || 'Unknown',
        country: data.carrier?.country || 'Unknown',
      },
    }

    // For “deep”, provide a richer payload (best-effort; may be partial depending on provider).
    if (mode === 'deep') {
      return NextResponse.json(
        {
          ...basicResponse,
          limitedInfo: false,
          warranty: {
            status: data.warranty?.status || 'unknown',
            expiryDate: data.warranty?.expiryDate || null,
            coverage: data.warranty?.coverage || null,
          },
          purchaseDate: data.purchaseDate || null,
          repairCoverage: data.repairCoverage ?? false,
          icloud: {
            status: data.iCloud?.status || 'unknown',
            fmiEnabled: data.iCloud?.fmiEnabled ?? false,
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json(basicResponse, { status: 200 })
  } catch (error: any) {
    console.error('IMEI check error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to check IMEI' },
      { status: 500 }
    )
  }
}


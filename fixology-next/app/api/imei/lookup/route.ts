// app/api/imei/lookup/route.ts
// IMEI Lookup API (imeicheck.net) with mock fallback for dev/demo

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

const IMEICHECK_API_URL = 'https://api.imeicheck.net/v1/check'

interface IMEICheckResponse {
  success: boolean
  data?: {
    imei: string
    brand?: string
    model?: string
    model_number?: string
    device_type?: string
    manufacturer?: string
    carrier?: string
    carrier_country?: string
    sim_lock?: string
    blacklist_status?: string
    blacklist_reason?: string
    blacklist_date?: string
    icloud_status?: string
    fmi_status?: string
    warranty_status?: string
    warranty_expiry?: string
    purchase_date?: string
    repair_coverage?: boolean
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const { imei, mode } = (await request.json()) as { imei?: string; mode?: 'basic' | 'deep' }

    if (!imei) return NextResponse.json({ error: 'IMEI is required' }, { status: 400 })

    const cleanIMEI = imei.replace(/[\s-]/g, '')
    const isDeepScan = mode === 'deep'

    // Check credits for deep scan
    if (isDeepScan) {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Credits are best-effort: if the database is missing the column (migrations not applied),
        // do NOT crash lookup and do NOT block the scan. We simply skip enforcing credits.
        try {
          const rows = (await prisma.$queryRawUnsafe(
            `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shops' AND column_name='imei_credits' LIMIT 1`
          )) as any[]
          const enabled = !!rows?.length

          if (enabled) {
            const shopUser = await prisma.shopUser.findFirst({
              where: { email: user.email },
              include: { shop: { select: { id: true } } },
            })

            if (shopUser?.shop?.id) {
              const shop = await prisma.shop.findUnique({
                where: { id: shopUser.shop.id },
                select: { imeiCredits: true },
              })
              const credits = shop?.imeiCredits || 0
              if (credits < 1) {
                return NextResponse.json(
                  { error: 'Insufficient credits. Deep scan requires 1 credit.' },
                  { status: 402 }
                )
              }

              // Deduct credit
              await prisma.shop.update({
                where: { id: shopUser.shop.id },
                data: { imeiCredits: credits - 1 },
              })
            }
          }
        } catch (e) {
          console.warn('IMEI credit check skipped due to DB/schema issue:', e)
        }
      }
    }

    const apiKey = process.env.IMEICHECK_API_KEY
    if (!apiKey) {
      // Demo/dev mode: allow 14- or 15-digit input (legacy IMEI flows sometimes use 14-digit TAC+SNR).
      if (!/^\d{14,15}$/.test(cleanIMEI)) {
        return NextResponse.json({ error: 'Invalid IMEI format (must be 14-15 digits in mock mode)' }, { status: 400 })
      }
      return NextResponse.json(getMockData(cleanIMEI), { status: 200 })
    }

    // Production mode: provider expects 15-digit IMEI
    if (!/^\d{15}$/.test(cleanIMEI)) {
      return NextResponse.json({ error: 'Invalid IMEI format (must be 15 digits)' }, { status: 400 })
    }

    const response = await fetch(IMEICHECK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ imei: cleanIMEI }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error || `IMEI API returned ${response.status}`)
    }

    const apiResponse = (await response.json()) as IMEICheckResponse
    if (!apiResponse.success || !apiResponse.data) {
      throw new Error(apiResponse.error || 'Failed to lookup IMEI')
    }

    return NextResponse.json(transformResponse(apiResponse.data), { status: 200 })
  } catch (error: any) {
    console.error('IMEI Lookup Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to lookup IMEI' }, { status: 500 })
  }
}

function transformResponse(data: NonNullable<IMEICheckResponse['data']>) {
  return {
    imei: data.imei,
    valid: true,
    deviceInfo: {
      brand: data.brand || 'Unknown',
      model: data.model || 'Unknown',
      modelNumber: data.model_number || '',
      type: data.device_type || 'Smartphone',
      manufacturer: data.manufacturer || data.brand || 'Unknown',
    },
    carrier: data.carrier
      ? {
          name: data.carrier,
          country: data.carrier_country || 'Unknown',
          simLock: mapSimLock(data.sim_lock),
        }
      : undefined,
    blacklistStatus: {
      status: mapBlacklistStatus(data.blacklist_status),
      reason: data.blacklist_reason,
      reportedDate: data.blacklist_date,
    },
    warranty: {
      status: mapWarrantyStatus(data.warranty_status),
      expiryDate: data.warranty_expiry,
      coverage: undefined,
    },
    iCloud: {
      status: mapICloudStatus(data.icloud_status),
      fmiEnabled: data.fmi_status === 'on' || data.fmi_status === 'enabled',
    },
    purchaseDate: data.purchase_date,
    repairCoverage: data.repair_coverage ?? false,
  }
}

function mapSimLock(status?: string): 'locked' | 'unlocked' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (lower.includes('unlock') || lower === 'off') return 'unlocked'
  if (lower.includes('lock') || lower === 'on') return 'locked'
  return 'unknown'
}

function mapBlacklistStatus(status?: string): 'clean' | 'blacklisted' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (lower.includes('clean') || lower === 'no' || lower === 'off') return 'clean'
  if (lower.includes('black') || lower === 'yes' || lower === 'on') return 'blacklisted'
  return 'unknown'
}

function mapWarrantyStatus(status?: string): 'active' | 'expired' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (lower.includes('active') || lower === 'yes') return 'active'
  if (lower.includes('expir') || lower === 'no') return 'expired'
  return 'unknown'
}

function mapICloudStatus(status?: string): 'on' | 'off' | 'unknown' {
  if (!status) return 'unknown'
  const lower = status.toLowerCase()
  if (lower === 'off' || lower === 'clean' || lower === 'no') return 'off'
  if (lower === 'on' || lower === 'locked' || lower === 'yes') return 'on'
  return 'unknown'
}

function getMockData(imei: string) {
  // Hand-tuned demo overrides (keeps demos consistent)
  if (imei === '35655808844923' || imei === '356558088449233') {
    return {
      imei,
      valid: true,
      deviceInfo: {
        brand: 'Apple',
        model: 'iPhone 7',
        modelNumber: 'A1660',
        type: 'Smartphone',
        manufacturer: 'Apple',
      },
      carrier: {
        name: 'Unlocked',
        country: 'United States',
        simLock: 'unlocked' as const,
      },
      blacklistStatus: {
        status: 'clean' as const,
        reason: undefined,
        reportedDate: undefined,
      },
      warranty: {
        status: 'expired' as const,
        expiryDate: '2017-09-16',
        coverage: undefined,
      },
      iCloud: {
        status: 'off' as const,
        fmiEnabled: false,
      },
      purchaseDate: '2016-09-16',
      repairCoverage: false,
    }
  }

  if (imei === '356684168304476') {
    return {
      imei,
      valid: true,
      deviceInfo: {
        brand: 'Apple',
        model: 'iPhone 14 Pro Max',
        modelNumber: 'A2894',
        type: 'Smartphone',
        manufacturer: 'Apple',
      },
      carrier: {
        name: 'Unlocked',
        country: 'United States',
        simLock: 'unlocked' as const,
      },
      blacklistStatus: {
        status: 'clean' as const,
        reason: undefined,
        reportedDate: undefined,
      },
      warranty: {
        status: 'active' as const,
        expiryDate: '2025-06-15',
        coverage: 'AppleCare+',
      },
      iCloud: {
        status: 'off' as const,
        fmiEnabled: false,
      },
      purchaseDate: '2023-09-22',
      repairCoverage: true,
    }
  }

  // Deterministic “random” helper so the same IMEI always yields the same demo result.
  const hash = imei.split('').reduce((acc, ch) => (acc * 31 + (ch.charCodeAt(0) - 48)) >>> 0, 7)
  const pick = <T,>(arr: T[]) => arr[hash % arr.length]

  const prefix = imei.substring(0, 2)
  const isApple = ['35', '86', '01'].includes(prefix)
  const isSamsung = ['99', '52'].includes(prefix)

  const brand = isApple ? 'Apple' : isSamsung ? 'Samsung' : 'Unknown'
  const model = isApple
    ? pick(['iPhone 15 Pro', 'iPhone 14 Pro Max', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 12', 'iPhone 11', 'iPhone X', 'iPhone 8', 'iPhone 7'])
    : isSamsung
      ? pick(['Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy S22', 'Galaxy A54'])
      : 'Unknown Model'

  const blacklistOptions: Array<'clean' | 'blacklisted'> = ['clean', 'clean', 'clean', 'blacklisted']
  const lockOptions: Array<'locked' | 'unlocked'> = ['unlocked', 'unlocked', 'locked']
  const iCloudOptions: Array<'on' | 'off'> = ['off', 'off', 'off', 'on']
  const warrantyOptions: Array<'active' | 'expired'> = ['active', 'expired', 'expired']

  return {
    imei,
    valid: true,
    deviceInfo: {
      brand,
      model,
      modelNumber: isApple ? 'A2894' : isSamsung ? 'SM-S918U' : '',
      type: 'Smartphone',
      manufacturer: brand,
    },
    carrier: {
      name: pick(['AT&T', 'Verizon', 'T-Mobile', 'Unlocked']),
      country: 'United States',
      simLock: pick(lockOptions),
    },
    blacklistStatus: {
      status: pick(blacklistOptions),
    },
    warranty: {
      status: pick(warrantyOptions),
      expiryDate: '2025-06-15',
    },
    iCloud: {
      status: pick(iCloudOptions),
      fmiEnabled: false,
    },
    purchaseDate: '2023-09-22',
    repairCoverage: (hash % 2) === 0,
  }
}


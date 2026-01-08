// app/api/imei/lookup/route.ts
// IMEI Lookup API (imeicheck.net) with mock fallback for dev/demo

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'

const IMEICHECK_API_URL = 'https://api.imeicheck.net/v1/checks'

export async function POST(request: NextRequest) {
  try {
    const { imei, mode } = (await request.json()) as { imei?: string; mode?: 'basic' | 'deep' }

    if (!imei) return NextResponse.json({ error: 'IMEI is required' }, { status: 400 })

    const cleanIMEI = imei.replace(/[\s-]/g, '')
    const isDeepScan = mode === 'deep'
    const serviceId = isDeepScan ? 2 : 1 // basic=1, deep=2 per provider

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

    const apiKey = process.env.IMEICHECK_API_KEY || 'kNDOALombJnxrfKJZ0bkSu60xS80STI2BxBNFqA1db4e2d2f'
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
      body: JSON.stringify({ deviceId: cleanIMEI, serviceId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error || `IMEI API returned ${response.status}`)
    }

    const apiResponse = await response.json().catch(() => ({} as any))
    const normalized = normalizeApiResponse(apiResponse, cleanIMEI)
    return NextResponse.json(normalized, { status: 200 })
  } catch (error: any) {
    console.error('IMEI Lookup Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to lookup IMEI' }, { status: 500 })
  }
}

function normalizeApiResponse(raw: any, imei: string) {
  // imeicheck.net returns { id, status, result, serviceId, deviceId, ... }
  const result = raw?.result || raw?.data || raw || {}

  const brand =
    result.brand ||
    result.brandName ||
    result.deviceBrand ||
    result.manufacturer ||
    result.oem ||
    result.vendor ||
    result?.device?.brand ||
    result?.device?.manufacturer ||
    'Unknown'

  const model =
    result.model ||
    result.modelName ||
    result.deviceModel ||
    result.deviceName ||
    result.productName ||
    result.name ||
    result?.device?.model ||
    result?.device?.name ||
    'Unknown'

  const carrierName =
    result.carrier ||
    result.network ||
    result.lockedCarrier ||
    result.carrierName ||
    result.lockedCarrierName ||
    result.simLockCarrier
  const carrierCountry =
    result.carrier_country || result.country || result.lockedCarrierCountry || result.carrierCountry
  const simLock =
    result.sim_lock || result.simLock || result.lockStatus || result.networkLock || result.lockedStatus

  const blacklistStatusField =
    result.blacklist_status ||
    result.blacklistStatus ||
    result.blacklisted ||
    result.blacklist ||
    result.blacklistState
  const blacklistReason = result.blacklist_reason || result.blacklistReason
  const blacklistDate = result.blacklist_date || result.blacklistDate

  const warrantyStatus =
    result.warranty_status || result.warrantyStatus || result.coverageStatus || result.warranty
  const warrantyExpiry =
    result.warranty_expiry || result.warrantyExpiry || result.coverageEndDate || result.warrantyEndDate

  const icloudStatus =
    result.icloud_status || result.iCloudStatus || result.icloudStatus || result.findMyIphoneStatus
  const fmiStatus = result.fmi_status || result.fmiStatus || result.findMyIphone || result.findMyIphoneStatus

  return {
    imei: imei,
    valid: true,
    deviceInfo: {
      brand,
      model,
      modelNumber: result.model_number || result.modelNumber || '',
      type: result.device_type || result.type || 'Smartphone',
      manufacturer: result.manufacturer || brand,
    },
    carrier: carrierName
      ? {
          name: carrierName,
          country: carrierCountry || 'Unknown',
          simLock: mapSimLock(simLock),
        }
      : undefined,
    blacklistStatus: {
      status: mapBlacklistStatus(blacklistStatusField),
      reason: blacklistReason,
      reportedDate: blacklistDate,
    },
    warranty: {
      status: mapWarrantyStatus(warrantyStatus),
      expiryDate: warrantyExpiry,
      coverage: undefined,
    },
    iCloud: {
      status: mapICloudStatus(icloudStatus),
      fmiEnabled: fmiStatus === 'on' || fmiStatus === 'enabled',
    },
    purchaseDate: result.purchase_date || result.purchaseDate,
    repairCoverage: result.repair_coverage ?? result.repairCoverage ?? false,
    raw: result,
    provider: 'imeicheck.net',
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


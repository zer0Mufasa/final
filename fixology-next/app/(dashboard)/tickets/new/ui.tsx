'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GlassCard } from '@/components/dashboard/ui/glass-card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
  Ticket,
  Phone,
  User,
  Smartphone,
  AlertCircle,
  Shield,
  Clock,
  DollarSign,
  FileText,
  Check,
  X,
  ScanLine,
  Zap,
  Smartphone as DeviceIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { mockCustomers } from '@/lib/mock/data'
import { parseIntakeText } from '@/lib/ai/intake-parser'

type DeviceCategoryKey =
  | 'iphone'
  | 'samsung'
  | 'google'
  | 'motorola'
  | 'lg'
  | 'ipad'
  | 'tablet'
  | 'macbook'
  | 'laptop'
  | 'switch'
  | 'ps5'
  | 'xbox'

const deviceCatalog: Record<
  DeviceCategoryKey,
  {
    key: DeviceCategoryKey
    label: string
    deviceType: 'Phone' | 'Tablet' | 'Laptop' | 'Console'
    brand: string
    models: string[]
    imageSrc: string
  }
> = {
  iphone: {
    key: 'iphone',
    label: 'iPhone',
    deviceType: 'Phone',
    brand: 'Apple',
    models: [
      'iPhone 17 Pro Max',
      'iPhone 17 Pro',
      'iPhone 17 Air',
      'iPhone 17',
      'iPhone 16 Pro Max',
      'iPhone 16 Pro',
      'iPhone 16 Plus',
      'iPhone 16',
      'iPhone 15 Pro Max',
      'iPhone 15 Pro',
      'iPhone 15 Plus',
      'iPhone 15',
      'iPhone 14 Pro Max',
      'iPhone 14 Pro',
      'iPhone 14 Plus',
      'iPhone 14',
      'iPhone SE (3rd Gen)',
      'iPhone 13 Pro Max',
      'iPhone 13 Pro',
      'iPhone 13',
      'iPhone 13 Mini',
      'iPhone 12 Pro Max',
      'iPhone 12 Pro',
      'iPhone 12',
      'iPhone 12 Mini',
      'iPhone SE (2nd Gen)',
      'iPhone 11 Pro Max',
      'iPhone 11 Pro',
      'iPhone 11',
      'iPhone XR',
      'iPhone XS Max',
      'iPhone XS',
      'iPhone X',
      'iPhone 8 Plus',
      'iPhone 8',
      'iPhone 7 Plus',
      'iPhone 7',
      'iPhone SE (1st Gen)',
      'iPhone 6s Plus',
      'iPhone 6s',
      'iPhone 6 Plus',
      'iPhone 6',
      'iPhone 5s',
      'iPhone 5c',
    ],
    imageSrc: '/devices/iPhone_16_Pro_Max-130x130.png',
  },
  samsung: {
    key: 'samsung',
    label: 'Samsung',
    deviceType: 'Phone',
    brand: 'Samsung',
    models: [
      'Galaxy S25 Ultra',
      'Galaxy S25+',
      'Galaxy S25',
      'Galaxy Z Fold7',
      'Galaxy Z Flip7 FE',
      'Galaxy Z Flip7',
      'Galaxy Z Flip6',
      'Galaxy Z Fold6',
      'Galaxy S24 Ultra',
      'Galaxy S24+',
      'Galaxy S24',
      'Galaxy Z Fold5',
      'Galaxy S23 Ultra 5G',
      'Galaxy S23+ 5G',
      'Galaxy S23 5G',
      'Galaxy S23 FE',
      'Galaxy Z Fold4',
      'Galaxy Z Fold3 5G',
      'Galaxy Z Fold2 5G',
      'Galaxy Z Flip4',
      'Galaxy Z Flip3 5G',
      'Galaxy Z Flip',
      'Galaxy Fold',
      'Galaxy S22 Ultra 5G',
      'Galaxy S22+ 5G',
      'Galaxy S22 5G',
      'Galaxy S21 Ultra 5G',
      'Galaxy S21+ 5G',
      'Galaxy S21 FE 5G',
      'Galaxy S21 5G',
      'Galaxy S20 Ultra',
      'Galaxy S20+',
      'Galaxy S20 5G',
      'Galaxy S20 FE 5G',
      'Galaxy S20',
      'Galaxy S10 5G',
      'Galaxy S10 Plus',
      'Galaxy S10 Plus Ceramic',
      'Galaxy S10',
      'Galaxy S10 Lite',
      'Galaxy S10e',
      'Galaxy Note 20 Ultra 5G',
      'Galaxy Note 20 5G',
      'Galaxy Note 10 Plus 5G',
      'Galaxy Note 10 Plus',
      'Galaxy Note 10',
      'Galaxy A71 5G',
      'Galaxy A71',
      'Galaxy A70',
      'Galaxy A54 5G',
      'Galaxy A53 5G',
      'Galaxy A52 5G',
      'Galaxy A51 5G',
      'Galaxy A51',
      'Galaxy A50',
      'Galaxy A42 5G',
      'Galaxy A32 5G',
      'Galaxy A23',
      'Galaxy A22 5G',
      'Galaxy A21',
      'Galaxy A20',
      'Galaxy A13 5G',
      'Galaxy A12',
      'Galaxy A11',
      'Galaxy A10e',
      'Galaxy A10',
      'Galaxy A03s',
      'Galaxy A03',
      'Galaxy A02',
      'Galaxy A01',
      'Other / Custom',
    ],
    imageSrc: '/devices/Samsung_Galaxy_S25_Ultra-130x130.png',
  },
  google: {
    key: 'google',
    label: 'Google',
    deviceType: 'Phone',
    brand: 'Google',
    models: [
      'Pixel 10 Pro Fold',
      'Pixel 10 Pro XL',
      'Pixel 10 Pro',
      'Pixel 10',
      'Pixel 9 Pro XL',
      'Pixel 9 Pro Fold',
      'Pixel 9 Pro',
      'Pixel 9',
      'Pixel 8 Pro',
      'Pixel 8',
      'Pixel 7a',
      'Pixel 7 Pro',
      'Pixel 7',
      'Pixel 6 Pro',
      'Pixel 6',
      'Pixel 6a',
      'Pixel 5a',
      'Pixel 5',
      'Pixel 4a 5G',
      'Pixel 4a',
      'Pixel 4 XL',
      'Pixel 4',
      'Pixel 3a XL',
      'Pixel 3a',
      'Pixel 3 XL',
      'Pixel 3',
      'Pixel 2 XL',
      'Pixel 2',
      'Pixel XL',
      'Other / Custom',
    ],
    // Use a real Pixel image as the category tile art (white card background makes it read cleanly).
    imageSrc: '/devices/pixel_9.png',
  },
  motorola: {
    key: 'motorola',
    label: 'Motorola',
    deviceType: 'Phone',
    brand: 'Motorola',
    models: [
      'Razr+ (2024)',
      'Razr 2024',
      'Razr 40 (2023)',
      'Razr+',
      'One 5G Ace',
      'One 5G',
      'Moto G Stylus 5G',
      'Moto G Power (2021)',
      'Moto G Power',
      'Moto G Play',
      'Moto G Pure',
      'Moto G9 Power',
      'Moto G9 Play',
      'Moto G8 Stylus',
      'Moto G8 Power',
      'Moto G7 Power',
      'Moto Z4',
      'Moto Z3',
      'Moto Surf E6',
      'Moto Rugby Go E5 Play',
      'Moto Rugby E5',
      'Other / Custom',
    ],
    imageSrc: '/devices/razr_plus_2024-130x130.png',
  },
  lg: {
    key: 'lg',
    label: 'LG',
    deviceType: 'Phone',
    brand: 'LG',
    models: [
      'V60 ThinQ 5G',
      'V50',
      'V40',
      'Velvet 5G',
      'Q70',
      'G8X ThinQ',
      'G8 ThinQ',
      'G7 ThinQ',
      'G7 One',
      'Other / Custom',
    ],
    imageSrc: '/devices/Job_Details_Icon_-_Device_Model_-_LG_G8_ThinQ.jpg',
  },
  ipad: {
    key: 'ipad',
    label: 'iPad',
    deviceType: 'Tablet',
    brand: 'Apple',
    models: [
      'iPad Pro 12.9',
      'iPad Pro 11',
      'iPad 10.2',
      'iPad Air 4',
      'iPad Air 3',
      'iPad Mini 6',
      'iPad Mini 5',
      'iPad 9.7 (6th Gen)',
      'iPad (5th Generation)',
      'Other / Custom',
    ],
    imageSrc: '/devices/ipad.png',
  },
  tablet: {
    key: 'tablet',
    label: 'Tablet',
    deviceType: 'Tablet',
    brand: 'Other',
    models: ['Galaxy Tab S9', 'Galaxy Tab A8', 'Amazon Fire HD', 'Other / Custom'],
    imageSrc: '/devices/tablet.webp',
  },
  macbook: {
    key: 'macbook',
    label: 'MacBook',
    deviceType: 'Laptop',
    brand: 'Apple',
    models: ['MacBook Pro 16"', 'MacBook Pro 14"', 'MacBook Air 15"', 'MacBook Air 13"'],
    imageSrc: '/devices/macbook.jpg',
  },
  laptop: {
    key: 'laptop',
    label: 'Laptop',
    deviceType: 'Laptop',
    brand: 'Other',
    models: ['Dell XPS 13', 'Lenovo ThinkPad', 'HP Spectre', 'Acer Aspire', 'Other / Custom'],
    imageSrc: '/devices/laptop.png',
  },
  switch: {
    key: 'switch',
    label: 'Nintendo Switch',
    deviceType: 'Console',
    brand: 'Nintendo',
    models: ['Switch 2', 'Switch', 'Switch Lite'],
    imageSrc: '/devices/nintendoswitch.avif',
  },
  ps5: {
    key: 'ps5',
    label: 'PS5',
    deviceType: 'Console',
    brand: 'Sony',
    models: ['PS5', 'PS5 Slim', 'PS5 Digital'],
    imageSrc: '/devices/ps5.png',
  },
  xbox: {
    key: 'xbox',
    label: 'Xbox',
    deviceType: 'Console',
    brand: 'Microsoft',
    models: ['Xbox Series X', 'Xbox Series S'],
    imageSrc: '/devices/xbox.png',
  },
}

const slugify = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const normalizeForKey = (s: string) =>
  (s || '')
    .trim()
    // drop parenthetical notes like "(1st Gen)"
    .replace(/\([^)]*\)/g, '')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')

const toUnderscoreKey = (s: string) =>
  normalizeForKey(s)
    .replace(/\+/g, ' Plus')
    .replace(/5g/gi, '5G')
    .replace(/ /g, '_')

const extVariants = (pathNoExt: string) => [
  `${pathNoExt}.png`,
  `${pathNoExt}.jpg`,
  `${pathNoExt}.jpeg`,
  `${pathNoExt}.webp`,
  `${pathNoExt}.avif`,
]

const modelImageCandidates = (category: DeviceCategoryKey, model: string) => {
  const candidates: string[] = []
  const slug = slugify(model)
  const raw = (model || '').toLowerCase()
  const rawModel = (model || '').trim()
  const underscoreRaw = toUnderscoreKey(rawModel)

  // Generic: try straight matches in /public/devices using both slug and underscore, plus 130x130 variants.
  candidates.push(...extVariants(`/devices/${underscoreRaw}`))
  candidates.push(...extVariants(`/devices/${slug}`))
  candidates.push(...extVariants(`/devices/${underscoreRaw}-130x130`))

  // Preferred convention (new, clean): /public/devices/models/<category>/<slug>.(png|jpg|webp)
  candidates.push(...extVariants(`/devices/models/${category}/${slug}`))

  // Legacy / imported assets currently living directly under /public/devices/
  if (category === 'iphone') {
    const m = normalizeForKey(model)
    const isSE = m.toLowerCase().includes('iphone se')
    const jobKey = isSE ? 'iPhone_SE' : toUnderscoreKey(m)
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${jobKey}`))

    // Newer iPhone thumbs: iPhone_16_Pro_Max-130x130.png, etc.
    const key130 = toUnderscoreKey(m)
    candidates.push(`/devices/${key130}-130x130.png`)

    // iPhone 17 special-case files already in /public/devices/
    if (m.toLowerCase() === 'iphone 17 pro max') {
      candidates.push('/devices/apple-iphone-17-pro-max-cosmic-orange-official-image.webp')
    }
    if (m.toLowerCase() === 'iphone 17 pro') {
      candidates.push('/devices/17 pro.jpg')
    }
    if (m.toLowerCase().startsWith('iphone 17')) {
      candidates.push('/devices/iPhone-17-Black.jpg')
    }
  }

  if (category === 'samsung') {
    const m = normalizeForKey(model)

    // Z/Fold/Flip 7 thumbnails
    if (m.toLowerCase() === 'galaxy z fold7') candidates.push('/devices/Fold7-130x130.png')
    if (m.toLowerCase() === 'galaxy z flip7') candidates.push('/devices/Flip7-130x130.png')
    if (m.toLowerCase() === 'galaxy z flip7 fe') candidates.push('/devices/Flip7_FE-130x130.png')

    // Standardized keys for the "Job Details" assets: Samsung_Galaxy_...
    const galaxy = m.replace(/^samsung\s+/i, '').replace(/^galaxy\s+/i, '').trim()
    const keyBase = `Samsung_Galaxy_${toUnderscoreKey(galaxy)}`

    // Try a few variants for "+" models (some assets use "_" placeholder)
    const plusVariantA = keyBase.replace(/_Plus$/i, '_Plus')
    const plusVariantB = keyBase.replace(/_Plus$/i, '_')

    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${plusVariantA}`))
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${plusVariantB}`))

    // Newer Samsung thumbs: Samsung_Galaxy_S25_Ultra-130x130.png, etc.
    candidates.push(`/devices/${keyBase}-130x130.png`)

    // A couple one-off newer thumbs already present
    if (m.toLowerCase() === 'galaxy s24 ultra') candidates.push('/devices/Samsung24Ultra-130x130.png')
    if (m.toLowerCase() === 'galaxy s24+') candidates.push('/devices/Samsung24_plus-130x130.png')
    if (m.toLowerCase() === 'galaxy s24') candidates.push('/devices/samsung_galaxy_s24.png')
    if (m.toLowerCase() === 'galaxy s23+') candidates.push('/devices/samsung-galaxy-s23-plus-thumbnail.jpeg')
    if (m.toLowerCase() === 'galaxy s23 fe') candidates.push('/devices/Samsung_Galaxy_S23_FE-130x130.png')
    if (m.toLowerCase() === 'galaxy s23 ultra 5g') candidates.push('/devices/Samsung_Galaxy_S23_Ultra-130x130.jpg')
    if (m.toLowerCase() === 'galaxy s25') candidates.push('/devices/Samsung_Galaxy_S25-130x130.png')
    if (m.toLowerCase() === 'galaxy s25+') candidates.push('/devices/Samsung_Galaxy_S25_Plus-130x130.png')
    if (m.toLowerCase() === 'galaxy s25 ultra') candidates.push('/devices/Samsung_Galaxy_S25_Ultra-130x130.png')
  }

  if (category === 'google') {
    const m = normalizeForKey(model)
    const rest = m.replace(/^google\s+/i, '').trim() // "Pixel 8 Pro"

    // Job-details assets: Job_Details_Icon_-_Device_Model_-_Google_Pixel_7_Pro.png, etc.
    const jobKey = `Google_${toUnderscoreKey(rest)}`
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${jobKey}`))

    // Newer Pixel thumbs under /public/devices/
    if (rest.toLowerCase() === 'pixel 8') candidates.push('/devices/GooglePixel8-130x130.png')
    if (rest.toLowerCase() === 'pixel 8 pro') candidates.push('/devices/GooglePixel8Pro-130x130.png')
    if (rest.toLowerCase() === 'pixel 7a') candidates.push('/devices/Google_Pixel_7a-130x130.png')

    if (rest.toLowerCase() === 'pixel 10') candidates.push('/devices/Google_Pixel_10-130x130.png')
    if (rest.toLowerCase() === 'pixel 10 pro') candidates.push('/devices/Google_Pixel_10_Pro-130x130.png')
    if (rest.toLowerCase() === 'pixel 10 pro xl') candidates.push('/devices/Google_Pixel_10_Pro_XL-130x130.png')
    if (rest.toLowerCase() === 'pixel 10 pro fold') candidates.push('/devices/Google_Pixel_10_Pro_Fold-130x130.png')

    // Pixel 9 assets present (naming is a bit inconsistent)
    if (rest.toLowerCase() === 'pixel 9') candidates.push('/devices/pixel_9.png')
    if (rest.toLowerCase() === 'pixel 9 pro xl') {
      candidates.push('/devices/Pixel_9_Pro_XL_Obsidian-130x130.png')
      candidates.push('/devices/Pixel_9_Pro_XL_Rose_Quartz-130x130.png')
    }
    if (rest.toLowerCase() === 'pixel 9 pro fold') candidates.push('/devices/Pixel_9_Pro_Fold_2-130x130.png')
  }

  if (category === 'motorola') {
    const m = normalizeForKey(model)
    const rest = m.replace(/^motorola\s+/i, '').trim()

    // Job-details assets: Job_Details_Icon_-_Device_Model_-_Motorola_Moto_G7_Power.png, etc.
    const jobKey = `Motorola_${toUnderscoreKey(rest)}`
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${jobKey}`))

    // Razr thumbs under /public/devices/
    if (raw.includes('razr+') && raw.includes('2024')) {
      candidates.push('/devices/razr_plus_2024-130x130.png')
      candidates.push('/devices/Motorola_Razr_Plus-130x130.png')
    } else if (raw.includes('razr 2024') || (raw.includes('razr') && raw.includes('2024'))) {
      candidates.push('/devices/Moto_Razr_2024-130x130.png')
    } else if (raw.includes('razr 40') || raw.includes('2023')) {
      candidates.push('/devices/Motorola_Razr_40__2023_-130x130.png')
    } else if (raw.includes('razr+')) {
      candidates.push('/devices/Motorola_Razr_Plus-130x130.png')
    }

    // Moto G/Z generic fallbacks (some assets don't have brand prefix)
    candidates.push(...extVariants(`/devices/${toUnderscoreKey(rest)}`))
  }

  if (category === 'switch') {
    const m = normalizeForKey(model).toLowerCase()
    // Exact matches for the three Switch variants
    if (m.includes('switch 2') || m === 'switch 2') {
      candidates.push('/devices/nintendo-switch-2.avif')
    } else if (m.includes('lite')) {
      candidates.push('/devices/Nintendo-Switch-Lite-Console-Dialga-and-Palkia-Edition.avif')
    } else {
      candidates.push('/devices/nintendoswitch.avif')
    }
    // fallback
    candidates.push('/devices/switch.svg')
  }

  if (category === 'xbox') {
    const m = normalizeForKey(model).toLowerCase()
    // New Series S image and existing series assets
    if (m.includes('series x')) {
      candidates.push('/devices/Job_Details_Icon_-_Device_Model_-_Xbox_Series_X.png')
      candidates.push('/devices/xbox.png')
    }
    if (m.includes('series s')) {
      candidates.push('/devices/xboxseriess.webp')
    }
    // generic fallback
    candidates.push('/devices/xbox.png')
  }

  if (category === 'lg') {
    const m = normalizeForKey(model)
    const rest = m.replace(/^lg\s+/i, '').trim()

    // Job-details assets: Job_Details_Icon_-_Device_Model_-_LG_V60_ThinQ_5G.png, etc.
    const keyBase = `LG_${toUnderscoreKey(rest)}`
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${keyBase}`))
    candidates.push(...extVariants(`/devices/${toUnderscoreKey(rest)}`))
  }

  if (category === 'ipad') {
    const m = normalizeForKey(model)

    // Job-details assets: Job_Details_Icon_-_Device_Model_-_iPad_Pro_11.png, etc.
    const keyBase = toUnderscoreKey(m)
    candidates.push(...extVariants(`/devices/Job_Details_Icon_-_Device_Model_-_${keyBase}`))

    // Some iPad assets exist with slightly different names; try a couple extra known ones.
    if (m.toLowerCase() === 'ipad 10.2') candidates.push('/devices/Job_Details_Icon_-_Device_Model_-_iPad_10.2 (1).jpg')
    if (m.toLowerCase().startsWith('ipad (5th generation)')) candidates.push('/devices/Job_Details_Icon_-_Device_Model_-_iPad__5th_Generation_.jpg')
  }

  // de-dupe while preserving order
  return Array.from(new Set(candidates))
}

const topModels: Partial<Record<DeviceCategoryKey, string[]>> = {
  iphone: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 16 Pro Max'],
  samsung: ['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25'],
  google: ['Pixel 10 Pro Fold', 'Pixel 10 Pro XL', 'Pixel 10 Pro'],
  motorola: ['Razr+ (2024)', 'Razr 2024', 'Razr 40 (2023)'],
  lg: ['V60 ThinQ 5G', 'V50', 'V40'],
  ipad: ['iPad Pro 12.9', 'iPad Pro 11', 'iPad 10.2'],
  switch: ['Switch 2', 'Switch', 'Switch Lite'],
  xbox: ['Xbox Series X', 'Xbox Series S'],
}

const shimmerClass =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent'

const fallbackSilhouette = (
  <div className="flex flex-col items-center justify-center w-full h-full rounded-xl bg-white/8 border border-white/10 text-white/60">
    <DeviceIcon className="w-8 h-8" />
    <span className="text-[11px] mt-1">No image</span>
  </div>
)

type ModelButtonProps = {
  model: string
  category: DeviceCategoryKey
  isSelected: boolean
  onSelect: () => void
  priority?: boolean
}

function ModelButton({ model, category, isSelected, onSelect, priority }: ModelButtonProps) {
  const [failed, setFailed] = useState(false)
  const candidates = useMemo(() => modelImageCandidates(category, model), [category, model])
  const src = candidates[0] || deviceCatalog[category].imageSrc
  const isOther = model.toLowerCase().includes('other')

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-2xl border p-4 transition-all text-center aspect-square flex flex-col items-center justify-center',
        isSelected
          ? 'bg-white border-purple-500/35 ring-2 ring-purple-500/20 shadow-[0_10px_28px_rgba(0,0,0,0.22)]'
          : 'bg-white border-black/10 hover:border-black/15 shadow-[0_10px_28px_rgba(0,0,0,0.18)]'
      )}
    >
      {!failed ? (
        <div className={cn('w-24 h-24 sm:w-28 sm:h-28', !isSelected && 'bg-white')}>
          <NextImage
            src={isOther ? deviceCatalog[category].imageSrc : src}
            alt={model}
            width={120}
            height={120}
            className="object-contain w-full h-full"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiMyMTIxMjEiLz48L3N2Zz4="
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes="120px"
            unoptimized
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        fallbackSilhouette
      )}
      <div className={cn('mt-2 text-sm font-semibold tracking-tight', isSelected ? 'text-black/90' : 'text-black/80')}>{model}</div>
    </button>
  )
}

const deviceCategoryOrder: DeviceCategoryKey[] = [
  'iphone',
  'samsung',
  'google',
  'motorola',
  'lg',
  'ipad',
  'tablet',
  'macbook',
  'laptop',
  'switch',
  'ps5',
  'xbox',
]

function inferCategory(brand: string, model: string): DeviceCategoryKey | null {
  const b = (brand || '').toLowerCase()
  const m = (model || '').toLowerCase()
  if (m.includes('iphone')) return 'iphone'
  if (b.includes('samsung') || m.includes('galaxy')) return 'samsung'
  if (b.includes('google') || m.includes('pixel')) return 'google'
  if (b.includes('motorola') || m.includes('moto') || m.includes('razr')) return 'motorola'
  if (b === 'lg' || b.includes('lg') || m.startsWith('lg ') || m.includes(' thinq') || m.includes(' velvet')) return 'lg'
  if (m.includes('ipad')) return 'ipad'
  if (m.includes('macbook')) return 'macbook'
  if (m.includes('switch') || b.includes('nintendo')) return 'switch'
  if (m.includes('ps5') || m.includes('playstation') || b.includes('sony')) return 'ps5'
  if (m.includes('xbox') || b.includes('microsoft')) return 'xbox'
  if (m.includes('tablet')) return 'tablet'
  if (m.includes('laptop')) return 'laptop'
  return null
}

type IntakeForm = {
  // Step 1: Customer
  phone: string
  customerName: string
  email: string
  isNewCustomer: boolean
  customerId: string | null

  // Step 2: Device
  deviceCategory: DeviceCategoryKey | null
  deviceType: string
  brand: string
  model: string
  imei: string
  serial: string

  // Step 3: Problem
  issue: string

  // Step 4: Condition
  powersOn: boolean
  touchWorks: boolean
  faceIdWorks: boolean
  waterExposure: boolean
  dataBackedUp: boolean

  // Step 5: Quote
  estimatedRange: string
  timeEstimate: string

  // Step 6: Consent
  repairAuthorized: boolean
  dataRiskAcknowledged: boolean
  signature: string | null
  signLater: boolean

  // Step 7: Create
  ticketCreated: boolean
  ticketNumber: string | null
}

const steps = [
  { key: 1, label: 'Customer', icon: User },
  { key: 2, label: 'Device', icon: Smartphone },
  { key: 3, label: 'Problem', icon: AlertCircle },
  { key: 4, label: 'Condition', icon: CheckCircle2 },
  { key: 5, label: 'Quote', icon: DollarSign },
  { key: 6, label: 'Consent', icon: Shield },
  { key: 7, label: 'Create', icon: Ticket },
]

export function NewTicketClient() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<IntakeForm>({
    phone: '',
    customerName: '',
    email: '',
    isNewCustomer: false,
    customerId: null,
    deviceCategory: null,
    deviceType: '',
    brand: '',
    model: '',
    imei: '',
    serial: '',
    issue: '',
    powersOn: false,
    touchWorks: false,
    faceIdWorks: false,
    waterExposure: false,
    dataBackedUp: false,
    estimatedRange: '',
    timeEstimate: '',
    repairAuthorized: false,
    dataRiskAcknowledged: false,
    signature: null,
    signLater: false,
    ticketCreated: false,
    ticketNumber: null,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [quickStatus, setQuickStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [customModel, setCustomModel] = useState(false)
  const [modelQuery, setModelQuery] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeCategory, setActiveCategory] = useState<DeviceCategoryKey | null>(null)

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 520)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll as any)
  }, [])

  // Preload hero images for the newest models in each category to make the grid feel instant.
  useEffect(() => {
    if (typeof window === 'undefined') return
    Object.entries(topModels).forEach(([key, models]) => {
      (models || []).forEach((m) => {
        const src = modelImageCandidates(key as DeviceCategoryKey, m)[0]
        if (src && typeof window !== 'undefined' && window.Image) {
          const img = new window.Image()
          img.src = src
        }
      })
    })
  }, [])

  // Preload when category is selected/hovered.
  const preloadCategoryImages = (cat: DeviceCategoryKey) => {
    if (typeof window === 'undefined') return
    const models = deviceCatalog[cat]?.models || []
    models.slice(0, 24).forEach((m) => {
      const src = modelImageCandidates(cat, m)[0]
      if (src && typeof window !== 'undefined' && window.Image) {
        const img = new window.Image()
        img.src = src
      }
    })
  }

  // Auto-fill customer when phone is entered
  useEffect(() => {
    if (form.phone.length >= 10) {
      const found = mockCustomers.find((c) => c.phone.replace(/\D/g, '') === form.phone.replace(/\D/g, ''))
      if (found) {
        setForm((p) => ({
          ...p,
          customerName: found.name,
          email: found.email || '',
          isNewCustomer: false,
          customerId: found.id,
        }))
        setShowCustomerSearch(false)
      } else {
        setForm((p) => ({ ...p, isNewCustomer: true, customerId: null }))
      }
    }
  }, [form.phone])

  const setField = (k: keyof IntakeForm, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const formatPhone = (digits: string) => {
    const val = (digits || '').replace(/\D/g, '').slice(0, 10)
    if (val.length <= 3) return val
    if (val.length <= 6) return `(${val.slice(0, 3)}) ${val.slice(3)}`
    return `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6, 10)}`
  }

  const deviceTypeFromParsed = (deviceType: string) => {
    const t = (deviceType || '').toLowerCase()
    if (t.includes('ipad') || t.includes('tablet')) return 'Tablet'
    if (t.includes('macbook') || t.includes('laptop') || t.includes('thinkpad') || t.includes('surface')) return 'Laptop'
    if (t.includes('playstation') || t.includes('xbox') || t.includes('switch') || t.includes('console')) return 'Console'
    return 'Phone'
  }

  const firstIncompleteStep = (nextForm: IntakeForm) => {
    if ((nextForm.phone || '').replace(/\D/g, '').length < 10 || !nextForm.customerName.trim()) return 1
    if (!nextForm.deviceCategory || !nextForm.deviceType || !nextForm.brand.trim() || !nextForm.model.trim()) return 2
    if (!nextForm.issue.trim()) return 3
    return 4
  }

  const handleQuickFill = () => {
    const text = quickText.trim()
    if (!text) {
      setQuickStatus({ ok: false, message: 'Type one sentence and hit Fill.' })
      return
    }

    try {
      const parsed = parseIntakeText(text)
      const parsedPhoneDigits = (parsed.customer.phone || '').replace(/\D/g, '').slice(0, 10)
      const name = `${parsed.customer.firstName || ''} ${parsed.customer.lastName || ''}`.trim()
      const model = (parsed.device.model || parsed.device.type || '').trim()
      const inferredCategory = inferCategory((parsed.device.brand || '').trim(), model)

      const nextForm: IntakeForm = {
        ...form,
        phone: parsedPhoneDigits ? formatPhone(parsedPhoneDigits) : form.phone,
        customerName: name || form.customerName,
        email: parsed.customer.email || form.email,
        isNewCustomer: form.isNewCustomer,
        customerId: form.customerId,
        deviceCategory: inferredCategory || form.deviceCategory,
        deviceType: model ? deviceTypeFromParsed(model) : (form.deviceType || 'Phone'),
        brand: (parsed.device.brand || '').trim() || form.brand,
        model: model || form.model,
        issue: (parsed.issue || '').trim() || form.issue,
        estimatedRange: parsed.estimatedPriceRange ? `$${parsed.estimatedPriceRange.min} - $${parsed.estimatedPriceRange.max}` : form.estimatedRange,
      }

      setForm(nextForm)
      setStep(firstIncompleteStep(nextForm))
      setQuickStatus({
        ok: true,
        message: `Filled ${[
          parsedPhoneDigits || name ? 'customer' : null,
          parsed.device.brand || model ? 'device' : null,
          parsed.issue ? 'problem' : null,
        ].filter(Boolean).join(', ') || 'fields'} • ${parsed.confidence?.overall ?? 72}% confidence`,
      })
    } catch {
      setQuickStatus({ ok: false, message: 'Couldn’t parse that sentence. Try: “Jordan Lee 5125550142 iPhone 14 Pro cracked screen.”' })
    }
  }

  const next = () => {
    if (step < steps.length) {
      setStep((s) => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const back = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCreateTicket = () => {
    // Mock ticket creation
    const ticketNum = `FIX-${Math.floor(Math.random() * 9000) + 1000}`
    setForm((p) => ({ ...p, ticketCreated: true, ticketNumber: ticketNum }))
    setStep(7)
  }

  const canProceed = () => {
    if (step === 1) return form.phone.length >= 10 && form.customerName.length > 0
    if (step === 2) return !!form.deviceCategory && !!form.deviceType && !!form.brand && !!form.model
    if (step === 3) return form.issue.length > 10
    if (step === 4) return true // All optional
    if (step === 5) return true // Optional estimate
    if (step === 6) return form.repairAuthorized && form.dataRiskAcknowledged && (form.signature || form.signLater)
    return false
  }

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const progress = (step / steps.length) * 100

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl font-bold text-white/90">Front Desk Intake</h1>
              <p className="text-xs text-white/50 mt-0.5">Step {step} of {steps.length} • {steps[step - 1].label}</p>
            </div>
            <Link href="/tickets" className="btn-secondary px-4 py-2 rounded-xl text-sm">
              Cancel
            </Link>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400/90 to-purple-600/90 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = step === s.key
              const isComplete = step > s.key
              return (
                <button
                  key={s.key}
                  onClick={() => step > s.key && setStep(s.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 flex-1 transition-all',
                    isActive && 'scale-105',
                    step <= s.key && 'cursor-default'
                  )}
                  disabled={step <= s.key}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                      isComplete && 'bg-green-500/20 border border-green-400/30',
                      isActive && 'bg-purple-500/20 border border-purple-400/30',
                      !isComplete && !isActive && 'bg-white/5 border border-white/10'
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4 text-green-300" />
                    ) : (
                      <Icon className={cn('w-4 h-4', isActive ? 'text-purple-300' : 'text-white/40')} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold text-center',
                      isActive ? 'text-white' : isComplete ? 'text-white/60' : 'text-white/40'
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto mt-6 px-4 sm:px-6">
        {/* Quick Intake (optional) */}
        {!form.ticketCreated && step <= 3 && (
          <GlassCard className="p-5 sm:p-6 rounded-3xl mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">Quick intake</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    Paste one sentence — we’ll prefill fields. Doesn’t block intake.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickText('')
                  setQuickStatus(null)
                }}
                className="btn-ghost px-3 py-2 rounded-xl text-xs"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[120px] resize-none"
                placeholder='Try: “Jordan Lee 5125550142 iPhone 14 Pro cracked screen — wants same-day.”'
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickText('Jordan Lee 5125550142 iPhone 14 Pro cracked screen wants same-day')
                    setQuickStatus(null)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  Use example
                </button>
                <span className="text-xs text-white/40">Tip: include name + phone + device + issue.</span>
              </div>

              {quickStatus && (
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 border text-xs',
                    quickStatus.ok
                      ? 'bg-green-500/10 border-green-400/30 text-green-200'
                      : 'bg-yellow-500/10 border-yellow-400/30 text-yellow-200'
                  )}
                >
                  {quickStatus.message}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleQuickFill}
                  className="btn-primary px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Fill form
                </button>
                <div className="text-xs text-white/45">
                  You can still edit anything — <span className="text-white/65 font-semibold">nothing final yet</span>.
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Step 1: Customer */}
        {step === 1 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Customer Information</h2>
                  <p className="text-xs text-white/50 mt-0.5">Start with phone number — we'll find them if they exist</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Phone (primary) */}
                <div>
                  <label className="label mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        const formatted = val.length > 6 ? `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6, 10)}` : val.length > 3 ? `(${val.slice(0, 3)}) ${val.slice(3)}` : val
                        setField('phone', formatted)
                        setShowCustomerSearch(true)
                      }}
                      className="input pl-12 bg-white/[0.04] border-white/10 text-lg"
                      placeholder="(555) 123-4567"
                      autoFocus
                    />
                  </div>
                  {form.phone.length > 0 && form.phone.length < 14 && (
                    <p className="text-xs text-yellow-300/70 mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Enter full phone number to search
                    </p>
                  )}
                </div>

                {/* Customer status badge */}
                {form.phone.length >= 14 && (
                  <div
                    className={cn(
                      'rounded-2xl p-4 border transition-all',
                      form.isNewCustomer
                        ? 'bg-blue-500/10 border-blue-400/30'
                        : 'bg-green-500/10 border-green-400/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {form.isNewCustomer ? (
                        <>
                          <User className="w-5 h-5 text-blue-300" />
                          <div>
                            <div className="text-sm font-semibold text-white/90">First visit</div>
                            <div className="text-xs text-white/50 mt-0.5">We'll create a new customer profile</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-300" />
                          <div>
                            <div className="text-sm font-semibold text-white/90">Returning customer</div>
                            <div className="text-xs text-white/50 mt-0.5">Found in system — information auto-filled</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer search dropdown */}
                {showCustomerSearch && form.phone.length >= 10 && !form.customerId && (
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input bg-white/[0.04] border-white/10 mb-2"
                      placeholder="Search by name, phone, or email..."
                    />
                    {filteredCustomers.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setField('phone', c.phone)
                          setField('customerName', c.name)
                          setField('email', c.email || '')
                          setField('customerId', c.id)
                          setField('isNewCustomer', false)
                          setShowCustomerSearch(false)
                        }}
                        className="w-full text-left rounded-xl bg-white/[0.03] border border-white/10 p-3 hover:bg-white/[0.05] transition-colors mb-2"
                      >
                        <div className="text-sm font-semibold text-white/90">{c.name}</div>
                        <div className="text-xs text-white/50 mt-0.5">{c.phone} • {c.email || 'No email'}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="label mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setField('customerName', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="Full name"
                    disabled={!form.isNewCustomer && form.customerId !== null}
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="label mb-2">
                    Email <span className="text-white/40 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Trust microcopy */}
              <div className="mt-6 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white/70 font-semibold">Nothing final yet.</span> You can update customer information anytime before creating the ticket.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 2: Device */}
        {step === 2 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Device Information</h2>
                  <p className="text-xs text-white/50 mt-0.5">Choose a category — we’ll auto-fill brand + type</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-3">Device category *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {deviceCategoryOrder.map((k) => {
                      const c = deviceCatalog[k]
                      const selected = form.deviceCategory === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setCustomModel(false)
                            setModelQuery('')
                            setForm((p) => ({
                              ...p,
                              deviceCategory: k,
                              deviceType: c.deviceType,
                              brand: c.brand,
                              model: '',
                            }))
                            setActiveCategory(k)
                            preloadCategoryImages(k)
                          }}
                          className={cn(
                            'rounded-2xl border p-4 transition-all text-center aspect-square flex flex-col items-center justify-center',
                            // White tile treatment for the category cards only (so white/transparent images read cleanly).
                            selected
                              ? 'bg-white border-purple-500/35 ring-2 ring-purple-500/20 shadow-[0_10px_28px_rgba(0,0,0,0.28)]'
                              : 'bg-white border-black/10 hover:border-black/15 shadow-[0_10px_28px_rgba(0,0,0,0.22)]'
                          )}
                          onMouseEnter={() => preloadCategoryImages(k)}
                        >
                          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28">
                            <NextImage
                              src={c.imageSrc}
                              alt={c.label}
                              width={120}
                              height={120}
                              className="opacity-95 object-contain w-full h-full"
                              priority={selected}
                              loading={selected ? 'eager' : 'lazy'}
                              decoding="async"
                              unoptimized
                            />
                          </div>
                          <div className={cn('mt-2 text-sm font-semibold tracking-tight', selected ? 'text-black/90' : 'text-black/80')}>
                            {c.label}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model selection */}
                {form.deviceCategory ? (
                  <div>
                    <label className="label mb-3">Which device is it? *</label>

                    {/* Search models (UI-only) */}
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        value={modelQuery}
                        onChange={(e) => setModelQuery(e.target.value)}
                        placeholder="Search model (e.g., “14 Pro Max”, “PS5 Slim”)…"
                        className="input bg-white/[0.04] border-white/10 w-full"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {deviceCatalog[form.deviceCategory].models
                        .filter((m) => {
                          const q = modelQuery.trim().toLowerCase()
                          if (!q) return true
                          return m.toLowerCase().includes(q)
                        })
                        .map((m, idx) => (
                          <ModelButton
                            key={m}
                            model={m}
                            category={form.deviceCategory as DeviceCategoryKey}
                            isSelected={(!customModel && form.model === m) || (customModel && m.toLowerCase().includes('other'))}
                            onSelect={() => {
                              if (m.toLowerCase().includes('other')) {
                                setCustomModel(true)
                                setField('model', '')
                              } else {
                                setCustomModel(false)
                                setField('model', m)
                              }
                            }}
                            priority={idx < 12}
                          />
                        ))}
                    </div>

                    {customModel && (
                      <div className="mt-3">
                        <label className="label mb-2">Model (custom)</label>
                        <input
                          type="text"
                          value={form.model}
                          onChange={(e) => setField('model', e.target.value)}
                          className="input bg-white/[0.04] border-white/10"
                          placeholder="Type model (e.g., Lenovo Yoga 7i)"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-yellow-500/10 border border-yellow-400/25 px-4 py-3 text-xs text-yellow-200">
                    Pick a category first — it will auto-fill brand and device type.
                  </div>
                )}

                {/* Auto-filled summary */}
                <div>
                  <label className="label mb-2">Auto-filled</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                      <div className="text-[11px] text-white/45 font-semibold uppercase tracking-wider">Brand</div>
                      <div className="text-sm text-white/85 font-semibold mt-1">{form.brand || '—'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                      <div className="text-[11px] text-white/45 font-semibold uppercase tracking-wider">Device</div>
                      <div className="text-sm text-white/85 font-semibold mt-1">{form.model || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Identifiers */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label mb-2">
                      IMEI <span className="text-white/40 text-xs">(phones/tablets)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.imei}
                        onChange={(e) => setField('imei', e.target.value)}
                        className="input pr-12 bg-white/[0.04] border-white/10"
                        placeholder="15 digits"
                        maxLength={15}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                        title="Scan IMEI"
                        type="button"
                      >
                        <Camera className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label mb-2">
                      Serial <span className="text-white/40 text-xs">(laptops/consoles)</span>
                    </label>
                    <input
                      type="text"
                      value={form.serial}
                      onChange={(e) => setField('serial', e.target.value)}
                      className="input bg-white/[0.04] border-white/10"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                    <span className="text-xs text-white/55">
                      Category + model helps Fixology prefill parts, risk checks, and estimates. (UI only)
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 3: Problem */}
        {step === 3 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">What's Wrong?</h2>
                  <p className="text-xs text-white/50 mt-0.5">Describe the problem in plain language</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Quick issue presets */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Quick options</div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const isConsole = form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                      const opts = isConsole
                        ? ['HDMI', 'No Power', 'Overheating', 'Diagnostic']
                        : ['Screen', 'Battery', 'Diagnostic', 'Other']
                      return opts.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const preset =
                              opt === 'Screen'
                                ? 'Screen issue — '
                                : opt === 'Battery'
                                  ? 'Battery / power issue — '
                                  : opt === 'Diagnostic'
                                    ? 'Needs diagnostic — '
                                    : opt === 'HDMI'
                                      ? 'HDMI issue — '
                                      : opt === 'No Power'
                                        ? 'No power — '
                                        : opt === 'Overheating'
                                          ? 'Overheating — '
                                          : ''
                            setField('issue', preset)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          {opt}
                        </button>
                      ))
                    })()}
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    These don’t lock you in — they just start the sentence.
                  </div>
                </div>

                {/* Issue field */}
                <div>
                  <label className="label mb-2">What's wrong with the device? *</label>
                  <textarea
                    value={form.issue}
                    onChange={(e) => setField('issue', e.target.value)}
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/40 min-h-[140px] resize-none"
                    placeholder={
                      form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                        ? 'HDMI issue, no power, overheating, fan noise…'
                        : 'Screen cracked, not charging, battery drain, water damage…'
                    }
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span className="text-xs text-white/50">AI can auto-diagnose</span>
                    </div>
                    <span className="text-xs text-white/40">{form.issue.length} characters</span>
                  </div>
                </div>

                {/* Example placeholders */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Examples:</div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const isConsole = form.deviceCategory === 'ps5' || form.deviceCategory === 'xbox'
                      const examples = isConsole
                        ? ['HDMI no signal', 'No power', 'Overheating shutdown', 'Turns on then off', 'Fan loud + crash']
                        : ['Screen cracked', 'Not charging', 'Battery drains fast', "Won't turn on", 'Touch not working']
                      return examples.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setField('issue', ex)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        {ex}
                      </button>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 4: Condition Check */}
        {step === 4 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Device Condition</h2>
                  <p className="text-xs text-white/50 mt-0.5">Quick visual check — tap to confirm</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'powersOn', label: 'Powers on', icon: Zap },
                  { key: 'touchWorks', label: 'Touch works', icon: CheckCircle2 },
                  { key: 'faceIdWorks', label: 'Face ID works', icon: Shield },
                  { key: 'waterExposure', label: 'Water exposure', icon: AlertCircle },
                  { key: 'dataBackedUp', label: 'Data backed up', icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon
                  const checked = form[item.key as keyof IntakeForm] as boolean
                  return (
                    <button
                      key={item.key}
                      onClick={() => setField(item.key as keyof IntakeForm, !checked)}
                      className={cn(
                        'rounded-2xl p-4 border transition-all text-left',
                        checked
                          ? 'bg-green-500/10 border-green-400/30'
                          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                            checked ? 'bg-green-500/20' : 'bg-white/[0.05]'
                          )}
                        >
                          {checked ? (
                            <Check className="w-5 h-5 text-green-300" />
                          ) : (
                            <Icon className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={cn('text-sm font-semibold', checked ? 'text-white' : 'text-white/70')}>
                            {item.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                <p className="text-xs text-white/50 leading-relaxed">
                  All checks are optional. You can update these later during diagnosis.
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 5: Quote Snapshot */}
        {step === 5 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Estimated Quote</h2>
                  <p className="text-xs text-white/50 mt-0.5">Non-binding estimate — final price after diagnosis</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-2">Estimated Price Range</label>
                  <input
                    type="text"
                    value={form.estimatedRange}
                    onChange={(e) => setField('estimatedRange', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="$150 - $250"
                  />
                </div>

                <div>
                  <label className="label mb-2">Estimated Time</label>
                  <input
                    type="text"
                    value={form.timeEstimate}
                    onChange={(e) => setField('timeEstimate', e.target.value)}
                    className="input bg-white/[0.04] border-white/10"
                    placeholder="2-3 hours, Same day, 1-2 days..."
                  />
                </div>

                <div className="rounded-2xl bg-yellow-500/10 border border-yellow-400/30 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white/90 mb-1">Estimated — not final</div>
                      <div className="text-xs text-white/60 leading-relaxed">
                        This is a preliminary estimate. Final pricing will be confirmed after diagnosis. You stay in control.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 6: Customer Consent */}
        {step === 6 && (
          <div className="space-y-6">
            <GlassCard className="p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90">Customer Consent</h2>
                  <p className="text-xs text-white/50 mt-0.5">Authorization and acknowledgment</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Repair authorization */}
                <label className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.repairAuthorized}
                    onChange={(e) => setField('repairAuthorized', e.target.checked)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white/90">Repair Authorization</div>
                    <div className="text-xs text-white/50 mt-1">Customer authorizes repair work to proceed</div>
                  </div>
                </label>

                {/* Data risk */}
                <label className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.06] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.dataRiskAcknowledged}
                    onChange={(e) => setField('dataRiskAcknowledged', e.target.checked)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white/90">Data Risk Acknowledgment</div>
                    <div className="text-xs text-white/50 mt-1">Customer understands data loss risks</div>
                  </div>
                </label>

                {/* Signature */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white/90 mb-3">Signature</div>
                  <div className="space-y-3">
                    <div className="h-24 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
                      {form.signature ? (
                        <div className="text-sm text-white/70">Signature captured</div>
                      ) : (
                        <div className="text-xs text-white/40 text-center px-4">Draw signature here (UI only)</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setField('signature', 'captured')}
                        className="btn-secondary px-4 py-2 rounded-xl text-sm flex-1"
                      >
                        Capture Signature
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer hover:bg-white/[0.06] transition-colors">
                        <input
                          type="checkbox"
                          checked={form.signLater}
                          onChange={(e) => {
                            setField('signLater', e.target.checked)
                            if (e.target.checked) setField('signature', null)
                          }}
                          className="accent-purple-500"
                        />
                        <span className="text-xs text-white/70">Sign later</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 7: Create Ticket */}
        {step === 7 && (
          <div className="space-y-6">
            {form.ticketCreated ? (
              <GlassCard className="p-6 sm:p-8 rounded-3xl text-center">
                <div className="w-16 h-16 rounded-3xl bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-300" />
                </div>
                <h2 className="text-2xl font-bold text-white/90 mb-2">Ticket Created!</h2>
                <div className="text-lg font-semibold text-purple-300 mb-6">{form.ticketNumber}</div>
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-left">
                    <div className="text-xs text-white/50 mb-1">Status</div>
                    <div className="text-sm font-semibold text-white/90">Intake</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-left">
                    <div className="text-xs text-white/50 mb-1">Next Step</div>
                    <div className="text-sm font-semibold text-white/90">Device will be diagnosed</div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href={`/tickets/${form.ticketNumber?.toLowerCase()}`} className="btn-primary px-6 py-3 rounded-xl">
                    View Ticket
                  </Link>
                  <Link href="/tickets/new" className="btn-secondary px-6 py-3 rounded-xl">
                    Create Another
                  </Link>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6 sm:p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white/90">Ready to Create</h2>
                    <p className="text-xs text-white/50 mt-0.5">Review and create your repair ticket</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Customer</div>
                    <div className="text-sm font-semibold text-white/90">{form.customerName}</div>
                    <div className="text-xs text-white/50 mt-1">{form.phone}</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Device</div>
                    <div className="text-sm font-semibold text-white/90">
                      {form.brand} {form.model}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
                    <div className="text-xs text-white/50 mb-1">Issue</div>
                    <div className="text-sm text-white/80">{form.issue || '—'}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-green-500/10 border border-green-400/30 p-4 mb-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-300 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    All required fields complete
                  </div>
                  <div className="text-xs text-white/60">Ready to create ticket</div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button onClick={handleCreateTicket} className="btn-primary px-6 py-4 rounded-xl text-base font-semibold flex-1">
                    Create Repair Ticket
                  </button>
                  <button onClick={() => setStep(6)} className="btn-secondary px-6 py-4 rounded-xl">
                    Save & Finish Later
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {step < 7 && !form.ticketCreated && (
          <div className="sticky bottom-0 bg-black/40 backdrop-blur-xl border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 1}
                className="btn-secondary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={next}
                disabled={!canProceed()}
                className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back to top (follows user) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'fixed bottom-6 right-6 z-[70]',
          'rounded-2xl px-4 py-3 border',
          'bg-black/35 backdrop-blur-xl border-white/10 text-white/85',
          'shadow-[0_24px_60px_rgba(0,0,0,0.45)]',
          'transition-all duration-300',
          showBackToTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        )}
        aria-label="Back to top"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <ChevronUp className="w-4 h-4 text-purple-200" aria-hidden="true" />
          Back to top
        </span>
      </button>
    </div>
  )
}



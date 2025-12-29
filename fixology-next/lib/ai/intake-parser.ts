// lib/ai/intake-parser.ts
// Custom AI-free intake parser using pattern matching

interface ParsedDraft {
  customer: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
  }
  device: {
    brand: string
    model?: string
    type: string
    color?: string
  }
  issue: string
  noteType: 'CUSTOMER' | 'TECHNICIAN'
  technicianName?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  suggestedParts: string[]
  estimatedPriceRange?: {
    min: number
    max: number
  }
  questionsToAsk: string[]
  // Confidence scores for each field
  confidence: {
    customer: number
    device: number
    issue: number
    overall: number
  }
  // Risk flags
  riskFlags: string[]
  // Carrier and passcode if mentioned
  carrier?: string
  passcode?: string
}

// Device abbreviations mapping
const DEVICE_ABBREVIATIONS: Record<string, { brand: string; type: string }> = {
  '14pm': { brand: 'Apple', type: 'iPhone 14 Pro Max' },
  '14 pro max': { brand: 'Apple', type: 'iPhone 14 Pro Max' },
  '14 pro': { brand: 'Apple', type: 'iPhone 14 Pro' },
  '14 plus': { brand: 'Apple', type: 'iPhone 14 Plus' },
  '14': { brand: 'Apple', type: 'iPhone 14' },
  '13pm': { brand: 'Apple', type: 'iPhone 13 Pro Max' },
  '13 pro max': { brand: 'Apple', type: 'iPhone 13 Pro Max' },
  '13 pro': { brand: 'Apple', type: 'iPhone 13 Pro' },
  '13': { brand: 'Apple', type: 'iPhone 13' },
  '12pm': { brand: 'Apple', type: 'iPhone 12 Pro Max' },
  '12 pro': { brand: 'Apple', type: 'iPhone 12 Pro' },
  '12': { brand: 'Apple', type: 'iPhone 12' },
  '11 pro': { brand: 'Apple', type: 'iPhone 11 Pro' },
  '11': { brand: 'Apple', type: 'iPhone 11' },
  'xr': { brand: 'Apple', type: 'iPhone XR' },
  'xs': { brand: 'Apple', type: 'iPhone XS' },
  'x': { brand: 'Apple', type: 'iPhone X' },
  's23': { brand: 'Samsung', type: 'Galaxy S23' },
  's22': { brand: 'Samsung', type: 'Galaxy S22' },
  's21': { brand: 'Samsung', type: 'Galaxy S21' },
  'note20': { brand: 'Samsung', type: 'Galaxy Note 20' },
  'pixel8': { brand: 'Google', type: 'Pixel 8' },
  'pixel7': { brand: 'Google', type: 'Pixel 7' },
  'pixel6': { brand: 'Google', type: 'Pixel 6' },
}

// Common device patterns
const DEVICE_PATTERNS = [
  { pattern: /iphone\s*(\d+)\s*(pro\s*max|pro|plus|mini)?/i, brand: 'Apple', buildType: (match: RegExpMatchArray) => {
    const num = match[1]
    const variant = (match[2] || '').trim().toLowerCase()
    if (variant.includes('pro max')) return `iPhone ${num} Pro Max`
    if (variant.includes('pro')) return `iPhone ${num} Pro`
    if (variant.includes('plus')) return `iPhone ${num} Plus`
    if (variant.includes('mini')) return `iPhone ${num} Mini`
    return `iPhone ${num}`
  }},
  { pattern: /samsung\s*galaxy\s*(s\d+|note\s*\d+)/i, brand: 'Samsung', buildType: (match: RegExpMatchArray) => {
    return `Galaxy ${match[1]}`
  }},
  { pattern: /galaxy\s*(s\d+|note\s*\d+)/i, brand: 'Samsung', buildType: (match: RegExpMatchArray) => {
    return `Galaxy ${match[1]}`
  }},
  { pattern: /google\s*pixel\s*(\d+)/i, brand: 'Google', buildType: (match: RegExpMatchArray) => {
    return `Pixel ${match[1]}`
  }},
  { pattern: /pixel\s*(\d+)/i, brand: 'Google', buildType: (match: RegExpMatchArray) => {
    return `Pixel ${match[1]}`
  }},
]

// Phone number patterns
const PHONE_PATTERNS = [
  /\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/g, // (314) 287-1845, 314-287-1845, 3142871845
  /(\d{10})/g, // 10 digits in a row
]

// Name patterns
const NAME_PATTERNS = [
  /(?:customer|client|for|^)\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/i, // "customer John Smith" or "John Smith"
  /([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+(?:\d|iphone|samsung|pixel)/i, // "John Smith 314..." or "John Smith iPhone"
  /([A-Z][a-z]+)\s+([A-Z][a-z]+)/i, // Any two capitalized words
]

// Technician indicators
const TECHNICIAN_KEYWORDS = [
  'i tested', 'i checked', 'i replaced', 'i diagnosed', 'i found',
  'replaced', 'tested', 'checked', 'diagnosed', 'repaired',
  'technician', 'tech', 'repair', 'fixed'
]

// Customer indicators
const CUSTOMER_KEYWORDS = [
  'customer said', 'they said', 'they mentioned', 'reported',
  'brought in', 'dropped off', 'said', 'mentioned'
]

// Priority keywords
const PRIORITY_KEYWORDS = {
  URGENT: ['urgent', 'emergency', 'asap', 'immediately', 'critical'],
  HIGH: ['broken', "won't turn on", 'not working', 'dead', 'cracked', 'shattered', 'water damage'],
  NORMAL: ['issue', 'problem', 'damage', 'repair'],
  LOW: ['minor', 'small', 'cosmetic'],
}

// Common parts based on issue keywords
const PART_KEYWORDS: Record<string, string[]> = {
  'screen': ['LCD Screen', 'Display Assembly', 'Digitizer'],
  'lcd': ['LCD Screen', 'Display Assembly'],
  'display': ['LCD Screen', 'Display Assembly'],
  'battery': ['Battery', 'Battery Assembly'],
  'camera': ['Camera Module', 'Rear Camera', 'Front Camera'],
  'charging': ['Charging Port', 'USB-C Port', 'Lightning Port'],
  'speaker': ['Speaker', 'Earpiece Speaker', 'Bottom Speaker'],
  'button': ['Power Button', 'Volume Button', 'Home Button'],
  'back glass': ['Back Glass', 'Rear Glass'],
  'frame': ['Frame', 'Housing'],
}

export function parseIntakeText(text: string): ParsedDraft {
  const lowerText = text.toLowerCase()
  const originalText = text
  
  // Track confidence scores
  const confidence = {
    customer: 0,
    device: 0,
    issue: 0,
    overall: 0,
  }
  
  // Risk flags
  const riskFlags: string[] = []

  // Extract phone number
  let phone: string | undefined
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      // Take the first phone number found
      const phoneDigits = matches[0].replace(/\D/g, '')
      if (phoneDigits.length === 10 || phoneDigits.length === 11) {
        phone = phoneDigits.length === 11 && phoneDigits.startsWith('1') 
          ? phoneDigits.slice(1) 
          : phoneDigits
        confidence.customer += 30 // Phone found increases customer confidence
        break
      }
    }
  }
  
  // Extract carrier
  let carrier: string | undefined
  const carrierKeywords: Record<string, string> = {
    'sprint': 'Sprint',
    't-mobile': 'T-Mobile',
    'tmobile': 'T-Mobile',
    't mobile': 'T-Mobile',
    'verizon': 'Verizon',
    'att': 'AT&T',
    'at&t': 'AT&T',
    'at and t': 'AT&T',
    'cricket': 'Cricket',
    'boost': 'Boost',
    'metro': 'Metro',
  }
  for (const [key, value] of Object.entries(carrierKeywords)) {
    if (lowerText.includes(key)) {
      carrier = value
      break
    }
  }
  
  // Extract passcode
  let passcode: string | undefined
  const passcodeMatch = text.match(/\b(passcode|code|pin|password)[\s:]*(\d{4,6})\b/i)
  if (passcodeMatch) {
    passcode = passcodeMatch[2]
  }

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  const email = emailMatch ? emailMatch[0] : undefined

  // Extract names - look for capitalized words that appear before phone/device
  let firstName: string | undefined
  let lastName: string | undefined
  
  // Split text to find name section (usually at the beginning)
  const words = text.split(/\s+/)
  const nameCandidates: string[] = []
  
  // Look for capitalized words at the start (likely names)
  for (let i = 0; i < Math.min(words.length, 5); i++) {
    const word = words[i].replace(/[^A-Za-z]/g, '')
    if (word.length > 1 && word[0] === word[0].toUpperCase() && word[1] === word[1].toLowerCase()) {
      // Skip common non-name words
      if (!['Customer', 'Client', 'For', 'The', 'This', 'That', 'Their', 'They'].includes(word)) {
        nameCandidates.push(word)
      }
    } else {
      // Stop if we hit a non-capitalized word or number
      break
    }
  }
  
  // Take first two capitalized words as name
  if (nameCandidates.length >= 2) {
    firstName = nameCandidates[0]
    lastName = nameCandidates[1]
    confidence.customer += 40 // Full name found
  } else if (nameCandidates.length === 1) {
    firstName = nameCandidates[0]
    confidence.customer += 20 // First name only
  }
  
  // Also try pattern matching as fallback
  if (!firstName || !lastName) {
    for (const pattern of NAME_PATTERNS) {
      const match = text.match(pattern)
      if (match && match[1] && match[2]) {
        // Skip if it's a device name
        if (!match[1].toLowerCase().includes('iphone') && 
            !match[1].toLowerCase().includes('samsung') &&
            !match[1].toLowerCase().includes('pixel') &&
            !match[1].toLowerCase().includes('galaxy')) {
          firstName = match[1]
          lastName = match[2]
          break
        }
      }
    }
  }

  // Extract device
  let deviceBrand = 'Unknown'
  let deviceType = 'Device'
  let deviceModel: string | undefined
  let deviceColor: string | undefined

  // Check abbreviations first
  for (const [abbr, device] of Object.entries(DEVICE_ABBREVIATIONS)) {
    if (lowerText.includes(abbr)) {
      deviceBrand = device.brand
      deviceType = device.type
      confidence.device = 90 // High confidence for abbreviations
      break
    }
  }

  // If no abbreviation match, try patterns
  if (deviceBrand === 'Unknown') {
    for (const { pattern, brand, buildType } of DEVICE_PATTERNS) {
      const match = text.match(pattern)
      if (match) {
        deviceBrand = brand
        deviceType = buildType(match)
        confidence.device = 85 // High confidence for pattern match
        break
      }
    }
  } else {
    confidence.device = Math.max(confidence.device, 80) // Already set from abbreviation
  }
  
  // If still unknown, try generic detection
  if (deviceBrand === 'Unknown') {
    if (lowerText.includes('iphone') || lowerText.includes('apple')) {
      deviceBrand = 'Apple'
      deviceType = 'iPhone'
      confidence.device = 50 // Lower confidence for generic
    } else if (lowerText.includes('samsung') || lowerText.includes('galaxy')) {
      deviceBrand = 'Samsung'
      deviceType = 'Galaxy'
      confidence.device = 50
    } else if (lowerText.includes('pixel') || lowerText.includes('google')) {
      deviceBrand = 'Google'
      deviceType = 'Pixel'
      confidence.device = 50
    }
  }

  // Extract color (common colors)
  const colorMatch = text.match(/\b(black|white|red|blue|green|yellow|purple|pink|gold|silver|space gray|space grey|midnight|starlight|alpine green|deep purple)\b/i)
  if (colorMatch) {
    deviceColor = colorMatch[1]
  }

  // Determine note type
  let noteType: 'CUSTOMER' | 'TECHNICIAN' = 'CUSTOMER'
  let technicianName: string | undefined

  const hasTechnicianKeywords = TECHNICIAN_KEYWORDS.some(keyword => lowerText.includes(keyword))
  const hasCustomerKeywords = CUSTOMER_KEYWORDS.some(keyword => lowerText.includes(keyword))

  if (hasTechnicianKeywords && !hasCustomerKeywords) {
    noteType = 'TECHNICIAN'
    // Try to extract technician name from "I [name]" pattern
    const techNameMatch = text.match(/i\s+([A-Z][a-z]+)\s+(?:tested|checked|replaced|diagnosed)/i)
    if (techNameMatch) {
      technicianName = techNameMatch[1]
    }
  }

  // Extract issue description
  // Find the issue part (usually after device mention or contains keywords)
  let issue = originalText
  
  // Try to find issue after device mention
  const deviceMatch = text.match(/(?:iphone|samsung|pixel|galaxy|14pm|13pm|14 pro|13 pro).*?(screen|lcd|battery|camera|damage|broken|cracked|issue|problem|said|mentioned|dropped|accident)/i)
  if (deviceMatch) {
    const deviceIndex = text.toLowerCase().indexOf(deviceMatch[0].toLowerCase())
    issue = text.substring(deviceIndex + deviceMatch[0].length).trim()
  }
  
  // Remove name and phone if they appear at the start
  if (firstName && lastName) {
    issue = issue.replace(new RegExp(`^${firstName}\\s+${lastName}`, 'i'), '').trim()
  }
  if (phone) {
    issue = issue.replace(new RegExp(phone, 'g'), '').trim()
  }
  
  // Remove device abbreviations and common words at start
  issue = issue
    .replace(/^(?:iphone|samsung|pixel|galaxy|14pm|13pm|14 pro|13 pro|14|13|12|11).*?/i, '')
    .replace(/^(?:customer|client|for|the|a|an)\s+/i, '')
    .trim()
  
  // Clean up multiple spaces
  issue = issue.replace(/\s+/g, ' ').trim()
  
  // If issue is too short or empty, reconstruct from keywords
  if (issue.length < 10) {
    // Extract key issue words
    const issueKeywords: string[] = []
    if (lowerText.includes('screen') || lowerText.includes('lcd') || lowerText.includes('display')) {
      issueKeywords.push('screen damage')
    }
    if (lowerText.includes('battery')) {
      issueKeywords.push('battery issue')
    }
    if (lowerText.includes('camera')) {
      issueKeywords.push('camera problem')
    }
    if (lowerText.includes('dropped') || lowerText.includes('accident')) {
      issueKeywords.push('physical damage')
    }
    if (lowerText.includes('cracked') || lowerText.includes('broken')) {
      issueKeywords.push('cracked/broken')
    }
    if (lowerText.includes('water')) {
      issueKeywords.push('water damage')
    }
    if (lowerText.includes("won't turn on") || lowerText.includes('not working')) {
      issueKeywords.push('power issue')
    }
    
    issue = issueKeywords.length > 0 
      ? issueKeywords.join(', ') 
      : originalText.replace(new RegExp(`${firstName || ''}\\s*${lastName || ''}`, 'i'), '')
                    .replace(new RegExp(phone || '', 'g'), '')
                    .replace(/\d{10,}/g, '')
                    .trim()
  }
  
  // Capitalize first letter
  if (issue.length > 0) {
    issue = issue.charAt(0).toUpperCase() + issue.slice(1)
  }

  // Determine priority
  let priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  for (const [level, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      priority = level as any
      if (level === 'URGENT') break // Urgent takes precedence
    }
  }
  
  // Detect risk flags
  if (lowerText.includes('water') || lowerText.includes('liquid') || lowerText.includes('dropped in')) {
    riskFlags.push('Liquid exposure detected')
  }
  if (lowerText.includes('fell') || lowerText.includes('dropped') || lowerText.includes('accident')) {
    riskFlags.push('Physical damage reported')
  }
  if (lowerText.includes('won\'t turn on') || lowerText.includes('dead') || lowerText.includes('no power')) {
    riskFlags.push('Power issue - may need board repair')
  }
  
  // Calculate issue confidence
  const issueKeywords = ['screen', 'lcd', 'battery', 'camera', 'cracked', 'broken', 'damage', 'issue', 'problem']
  const foundKeywords = issueKeywords.filter(keyword => lowerText.includes(keyword)).length
  confidence.issue = Math.min(90, 40 + (foundKeywords * 10))
  
  // Calculate overall confidence
  confidence.overall = Math.round(
    (confidence.customer * 0.3 + confidence.device * 0.4 + confidence.issue * 0.3)
  )

  // Suggest parts based on issue keywords
  const suggestedParts: string[] = []
  for (const [keyword, parts] of Object.entries(PART_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      suggestedParts.push(...parts)
    }
  }
  // Remove duplicates
  const uniqueParts = Array.from(new Set(suggestedParts))

  // Estimate price range based on device and issue
  let estimatedPriceRange: { min: number; max: number } | undefined
  if (deviceType.includes('iPhone')) {
    if (lowerText.includes('screen') || lowerText.includes('lcd') || lowerText.includes('display')) {
      estimatedPriceRange = { min: 100, max: 300 }
    } else if (lowerText.includes('battery')) {
      estimatedPriceRange = { min: 50, max: 150 }
    } else if (lowerText.includes('camera')) {
      estimatedPriceRange = { min: 80, max: 250 }
    } else {
      estimatedPriceRange = { min: 50, max: 200 }
    }
  } else {
    estimatedPriceRange = { min: 50, max: 200 }
  }

  // Generate questions to ask
  const questionsToAsk: string[] = []
  if (!phone) {
    questionsToAsk.push('What is the customer\'s phone number?')
  }
  if (!deviceType || deviceType === 'Device') {
    questionsToAsk.push('What device model is this?')
  }
  if (issue.length < 20) {
    questionsToAsk.push('Can you provide more details about the issue?')
  }

  return {
    customer: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      email: email || undefined,
    },
    device: {
      brand: deviceBrand,
      model: deviceModel,
      type: deviceType,
      color: deviceColor || undefined,
    },
    issue: issue || originalText,
    noteType,
    technicianName: technicianName || undefined,
    priority,
    suggestedParts: uniqueParts,
    estimatedPriceRange,
    questionsToAsk,
    confidence,
    riskFlags,
    carrier: carrier || undefined,
    passcode: passcode || undefined,
  }
}


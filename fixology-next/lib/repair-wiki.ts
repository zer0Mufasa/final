const REPAIR_WIKI_BASE = 'https://repair.wiki'
const REPAIR_WIKI_API = 'https://repair.wiki/w/api.php'

interface WikiSearchResult {
  title: string
  snippet: string
  url: string
}

interface WikiArticle {
  title: string
  content: string
  url: string
  sections: { title: string; content: string }[]
}

/**
 * Search repair.wiki for relevant articles
 */
export async function searchRepairWiki(query: string, limit = 5): Promise<WikiSearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: limit.toString(),
      format: 'json',
      origin: '*',
    })

    const response = await fetch(`${REPAIR_WIKI_API}?${params}`)
    const data = await response.json()

    if (!data.query?.search) {
      return []
    }

    return data.query.search.map((result: any) => ({
      title: result.title,
      snippet: stripHtml(result.snippet),
      url: `${REPAIR_WIKI_BASE}/w/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
    }))
  } catch (error) {
    console.error('Repair.wiki search error:', error)
    return []
  }
}

/**
 * Get full article content from repair.wiki
 */
export async function getRepairWikiArticle(title: string): Promise<WikiArticle | null> {
  try {
    // Get plain text content (more reliable than HTML parsing)
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      format: 'json',
      prop: 'extracts',
      exintro: 'false',
      explaintext: 'true',
      exlimit: '1',
      origin: '*',
    })

    const response = await fetch(`${REPAIR_WIKI_API}?${params}`)
    const data = await response.json()

    if (!data.query?.pages) {
      return null
    }

    const page = Object.values(data.query.pages)[0] as any
    if (!page || page.missing) {
      return null
    }

    const content = page.extract || ''

    // Get sections info
    const sectionsParams = new URLSearchParams({
      action: 'parse',
      page: title,
      format: 'json',
      prop: 'sections',
      origin: '*',
    })

    const sectionsResponse = await fetch(`${REPAIR_WIKI_API}?${sectionsParams}`)
    const sectionsData = await sectionsResponse.json()

    const sections =
      sectionsData.parse?.sections?.map((section: any) => ({
        title: section.line,
        content: '',
      })) || []

    return {
      title: page.title || title,
      content: cleanText(content),
      url: `${REPAIR_WIKI_BASE}/w/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      sections,
    }
  } catch (error) {
    console.error('Repair.wiki article fetch error:', error)
    return null
  }
}

/**
 * Get article content by section (more efficient for large articles)
 */
export async function getRepairWikiSection(title: string, section: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'parse',
      page: title,
      section: section.toString(),
      format: 'json',
      prop: 'text',
      origin: '*',
    })

    const response = await fetch(`${REPAIR_WIKI_API}?${params}`)
    const data = await response.json()

    if (!data.parse) {
      return null
    }

    // Simple HTML tag removal without cheerio
    const html = data.parse.text['*'] || ''
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')

    return cleanText(text)
  } catch (error) {
    console.error('Repair.wiki section fetch error:', error)
    return null
  }
}

/**
 * Search and get relevant content for a repair query
 * This is the main function to use in the chat
 */
export async function getRepairKnowledge(query: string): Promise<{ knowledge: string; sources: string[] }> {
  try {
    // Search for relevant articles
    const searchResults = await searchRepairWiki(query, 3)

    if (searchResults.length === 0) {
      return { knowledge: '', sources: [] }
    }

    // Get content from top results
    const articles: string[] = []
    const sources: string[] = []

    for (const result of searchResults.slice(0, 2)) {
      const article = await getRepairWikiArticle(result.title)
      if (article) {
        // Limit content length to avoid token overflow
        const truncatedContent = article.content.slice(0, 2000)
        articles.push(`## ${article.title}\nSource: ${article.url}\n\n${truncatedContent}`)
        sources.push(article.url)
      }
    }

    if (articles.length === 0) {
      return { knowledge: '', sources: [] }
    }

    const knowledge = `
---
REPAIR.WIKI KNOWLEDGE BASE:
The following information is from repair.wiki, a trusted device repair knowledge base.
Use this information to help answer the user's question.

${articles.join('\n\n---\n\n')}
---
`

    return { knowledge, sources }
  } catch (error) {
    console.error('Failed to get repair knowledge:', error)
    return { knowledge: '', sources: [] }
  }
}

// Helper functions
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Extract keywords from user query for better wiki search
 */
export function extractSearchTerms(query: string): string {
  // Common repair-related terms to boost
  const deviceTerms = ['iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'pixel', 'android']
  const repairTerms = [
    'screen',
    'battery',
    'charging',
    'port',
    'speaker',
    'camera',
    'motherboard',
    'logic board',
  ]
  const issueTerms = ['not working', 'broken', 'dead', "won't", "doesn't", 'error', 'panic', 'kernel']

  const lowerQuery = query.toLowerCase()
  const keywords: string[] = []

  // Capture panic/error codes (e.g., "panic 210", "panic log 200,000x", "0x1234abcd", "error 4013")
  const codes: string[] = []
  const codeMatches = lowerQuery.match(/\b0x[0-9a-f]{4,}\b/g) || []
  codes.push(...codeMatches)

  // Numeric codes often show up with panic/error/log keywords
  const numericWithContext =
    lowerQuery.match(/\b(?:panic|kernel|error|code|log)\b[^0-9a-z]*([0-9]{3,6}(?:,[0-9]{3})?x?)/g) || []
  for (const m of numericWithContext) {
    const n = m.replace(/.*\b(?:panic|kernel|error|code|log)\b[^0-9a-z]*/g, '').trim()
    if (n) codes.push(n.replace(/,/g, ''))
  }

  // Capture device model phrases like "iphone 15", "iphone 12 pro", "macbook air m1"
  const modelMatch = lowerQuery.match(/\b(iphone|ipad|macbook|samsung|galaxy|pixel)\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/)
  if (modelMatch) {
    keywords.push(`${modelMatch[1]} ${modelMatch[2]}`.trim())
  }

  // Extract device mentions
  deviceTerms.forEach((term) => {
    if (lowerQuery.includes(term)) keywords.push(term)
  })

  // Extract repair component mentions
  repairTerms.forEach((term) => {
    if (lowerQuery.includes(term)) keywords.push(term)
  })

  // Add high-signal issue words
  ;['panic', 'kernel', 'boot loop', 'restarting', 'overheating', '4013', 'tristar', 'baseband'].forEach((t) => {
    if (lowerQuery.includes(t)) keywords.push(t)
  })

  // If we have any codes, include them (they dramatically improve search accuracy)
  for (const c of Array.from(new Set(codes)).slice(0, 3)) {
    keywords.push(c)
  }

  // If we have keywords, use them; otherwise use the original query
  if (keywords.length > 0) {
    return Array.from(new Set(keywords)).slice(0, 10).join(' ')
  }

  // Clean up the query for search
  return query
    .replace(/[?!.,]/g, '')
    .split(' ')
    .filter((word) => word.length > 2)
    .slice(0, 5)
    .join(' ')
}

/**
 * Detect if the message is repair-related
 */
export function detectRepairQuestion(message: string): boolean {
  const repairKeywords = [
    // Devices
    'iphone',
    'ipad',
    'macbook',
    'samsung',
    'galaxy',
    'pixel',
    'android',
    'phone',
    'tablet',
    'laptop',
    // Components
    'screen',
    'display',
    'lcd',
    'oled',
    'battery',
    'charging',
    'port',
    'usb-c',
    'lightning',
    'speaker',
    'microphone',
    'camera',
    'lens',
    'motherboard',
    'logic board',
    'pcb',
    'connector',
    'flex',
    'cable',
    'digitizer',
    'touch',
    // Issues
    'broken',
    'cracked',
    'dead',
    'not working',
    "won't turn on",
    "won't charge",
    'boot loop',
    'stuck',
    'frozen',
    'black screen',
    'white screen',
    'blue screen',
    'overheating',
    'hot',
    'swelling',
    'bulging',
    // Technical
    'panic',
    'kernel',
    'error code',
    'diagnostic',
    'troubleshoot',
    'repair',
    'replace',
    'fix',
    'solder',
    'micro-soldering',
    'reball',
    'reflow',
    'tristar',
    'tigris',
    'hydra',
    'nand',
    'cpu',
    'pmic',
    'baseband',
  ]

  const lowerMessage = message.toLowerCase()
  return repairKeywords.some((keyword) => lowerMessage.includes(keyword))
}

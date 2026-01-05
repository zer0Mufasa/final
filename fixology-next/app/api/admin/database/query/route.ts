import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

// Only allow SELECT queries for safety
const ALLOWED_QUERIES = [
  'SELECT',
  'WITH',
]

const BLOCKED_KEYWORDS = [
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'INSERT',
  'UPDATE',
  'GRANT',
  'REVOKE',
]

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'database.query')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { query } = body || {}

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query string is required' }, { status: 400 })
  }

  const queryUpper = query.trim().toUpperCase()

  // Check if query starts with allowed keyword
  const isAllowed = ALLOWED_QUERIES.some((keyword) => queryUpper.startsWith(keyword))
  if (!isAllowed) {
    return NextResponse.json(
      { error: 'Only SELECT queries are allowed' },
      { status: 400 }
    )
  }

  // Check for blocked keywords
  const hasBlockedKeyword = BLOCKED_KEYWORDS.some((keyword) => queryUpper.includes(keyword))
  if (hasBlockedKeyword) {
    return NextResponse.json(
      { error: 'Query contains blocked keywords' },
      { status: 400 }
    )
  }

  try {
    // Execute query using Prisma's raw query (read-only)
    const result = await prisma.$queryRawUnsafe(query)

    await logAdminAction(
      admin,
      'database.query',
      'database',
      null,
      'Executed database query',
      { query: query.substring(0, 100) }, // Log first 100 chars only
      request
    )

    return NextResponse.json({
      result,
      rowCount: Array.isArray(result) ? result.length : 1,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Query execution failed', details: error.message },
      { status: 500 }
    )
  }
}

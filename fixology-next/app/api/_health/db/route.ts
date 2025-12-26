import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export const runtime = 'nodejs'

function redactDb(url: string) {
  try {
    const u = new URL(url)
    const host = u.host
    const db = u.pathname?.replace(/^\//, '') || ''
    return { host, db }
  } catch {
    return { host: 'unknown', db: 'unknown' }
  }
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const info = dbUrl ? redactDb(dbUrl) : { host: '(missing)', db: '(missing)' }

  try {
    // lightweight query
    await prisma.shop.count()
    return NextResponse.json({ ok: true, database: info })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        database: info,
        error: error?.message || 'DB error',
      },
      { status: 500 }
    )
  }
}



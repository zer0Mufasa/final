import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'

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
    // Basic connectivity
    await prisma.$queryRaw`SELECT 1`

    // Schema checks (common drift when migrations didn't run)
    const requiredColumns: Array<{ table: string; column: string }> = [
      { table: 'shops', column: 'imei_credits' },
      { table: 'shops', column: 'onboarding_completed_at' },
      { table: 'shops', column: 'business_hours' },
    ]

    const missing: string[] = []
    for (const { table, column } of requiredColumns) {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
        table,
        column
      )) as any[]
      if (!rows?.length) missing.push(`${table}.${column}`)
    }

    if (missing.length) {
      return NextResponse.json(
        { ok: false, database: info, schema: { ok: false, missing } },
        { status: 503 }
      )
    }

    return NextResponse.json({ ok: true, database: info, schema: { ok: true } })
  } catch (error: any) {
    // Prisma "missing column" (schema out of date) can also show up here depending on the query.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
      const missingColumn = (error.meta as any)?.column as string | undefined
      return NextResponse.json(
        {
          ok: false,
          database: info,
          schema: { ok: false, missing: missingColumn ? [missingColumn] : ['P2022 (missing column)'] },
          error: 'Database schema is out of date',
        },
        { status: 503 }
      )
    }
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



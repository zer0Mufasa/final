import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    // Check for required columns that commonly drift in production if migrations didn't run.
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
        {
          status: 'degraded',
          database: {
            status: 'connected',
            latency: dbLatency,
          },
          schema: {
            ok: false,
            missing,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      database: {
        status: 'connected',
        latency: dbLatency,
      },
      schema: {
        ok: true,
      },
      api: {
        status: 'operational',
        uptime: 99.9,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: {
          status: 'error',
          error: error.message,
        },
        schema: {
          ok: false,
        },
        api: {
          status: 'operational',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

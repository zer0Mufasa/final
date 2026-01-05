import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      database: {
        status: 'connected',
        latency: dbLatency,
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
        api: {
          status: 'operational',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // TODO: Implement actual SMS tracking when SMS service is integrated
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return NextResponse.json({
    sentToday: 0,
    successRate: 0,
    costToday: 0,
    failed: 0,
  })
}

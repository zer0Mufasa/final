import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get basic database stats
  const [
    shopCount,
    userCount,
    ticketCount,
    invoiceCount,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shopUser.count(),
    prisma.ticket.count(),
    prisma.invoice.count(),
  ])

  return NextResponse.json({
    stats: {
      tableCount: 20, // Approximate
      totalRows: shopCount + userCount + ticketCount + invoiceCount,
      backupCount: 0, // TODO: Implement backup tracking
      deletedRecords: 0, // TODO: Count soft-deleted records
    },
  })
}

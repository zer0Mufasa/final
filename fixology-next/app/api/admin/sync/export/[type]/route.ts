import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request, { params }: { params: { type: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  // Create export job
  const job = await prisma.exportJob.create({
    data: {
      type: params.type,
      format,
      status: 'generating',
      createdById: admin.id,
    },
  })

  // TODO: Generate file in background
  // For now, return placeholder
  const csvData = `id,name,created_at\n1,Example,2024-01-01\n`

  await logAdminAction(
    admin,
    'export.start',
    'export_job',
    job.id,
    `Started export: ${params.type} (${format})`,
    { jobId: job.id, type: params.type, format },
    request
  )

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
      'Content-Disposition': `attachment; filename="${params.type}-${new Date().toISOString()}.${format}"`,
    },
  })
}

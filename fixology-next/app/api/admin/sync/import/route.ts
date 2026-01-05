import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Create import job
  const job = await prisma.importJob.create({
    data: {
      type,
      status: 'pending',
      createdById: admin.id,
    },
  })

  // TODO: Process file in background
  // For now, just mark as processing
  await prisma.importJob.update({
    where: { id: job.id },
    data: { status: 'processing' },
  })

  await logAdminAction(
    admin,
    'import.start',
    'import_job',
    job.id,
    `Started import: ${type}`,
    { jobId: job.id, type },
    request
  )

  return NextResponse.json({ job })
}

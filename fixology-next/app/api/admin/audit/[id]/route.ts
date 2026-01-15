import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

// This route depends on request headers/cookies for authentication, so it must be dynamic.
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const log = await prisma.adminAuditLog.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!log) return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })

  return NextResponse.json({
    log: {
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      admin: log.admin,
    },
  })
}

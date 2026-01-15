import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

// This route depends on request headers/cookies for authentication, so it must be dynamic.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const action = (searchParams.get('action') || '').trim()
    const targetType = (searchParams.get('targetType') || '').trim()
    const adminId = (searchParams.get('adminId') || '').trim()
    const targetId = (searchParams.get('targetId') || '').trim()
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 50)))
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    const orderDir = searchParams.get('orderDir') === 'asc' ? 'asc' : 'desc'

    const where: any = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (targetType) where.targetType = targetType
    if (adminId) where.adminId = adminId
    if (targetId) where.targetId = targetId

    const [logs, totalCount] = await prisma.$transaction([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { [orderBy]: orderDir },
        include: {
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    const formattedLogs = logs.map((log) => ({
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
    }))

    return NextResponse.json({ logs: formattedLogs, totalCount })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    )
  }
}

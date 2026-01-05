import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  try {
    const admin = getAdminFromRequest(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(10, Math.min(100, Number(searchParams.get('pageSize') || 50)))

    const where: any = {}
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [announcements, totalCount] = await prisma.$transaction([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.announcement.count({ where }),
    ])

    // Format dates for JSON serialization
    const formattedAnnouncements = announcements.map((ann) => ({
      ...ann,
      createdAt: ann.createdAt.toISOString(),
      updatedAt: ann.updatedAt.toISOString(),
      expiresAt: ann.expiresAt?.toISOString() || null,
    }))

    return NextResponse.json({ announcements: formattedAnnouncements, totalCount })
  } catch (error: any) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'announcement.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { title, content, type, isActive, targetAudience, expiresAt } = body || {}

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      type: type || 'INFO',
      isActive: isActive !== undefined ? isActive : false,
      targetAudience: targetAudience || 'ALL',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  await logAdminAction(
    admin,
    'announcement.create',
    'announcement',
    announcement.id,
    `Created announcement: ${announcement.title}`,
    { title, type: announcement.type, isActive: announcement.isActive },
    request
  )

  return NextResponse.json({ announcement }, { status: 201 })
}

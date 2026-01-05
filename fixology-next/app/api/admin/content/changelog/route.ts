import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const changelog = await prisma.changelogEntry.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    changelog: changelog.map((entry) => ({
      id: entry.id,
      version: entry.version,
      title: entry.title,
      content: entry.content,
      features: entry.features,
      improvements: entry.improvements,
      fixes: entry.fixes,
      publishedAt: entry.publishedAt?.toISOString() || null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    })),
  })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'content.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { version, title, content, features, improvements, fixes, publishedAt } = body || {}

  if (!version || !title || !content) {
    return NextResponse.json({ error: 'version, title, and content are required' }, { status: 400 })
  }

  const entry = await prisma.changelogEntry.create({
    data: {
      version,
      title,
      content,
      features: features || [],
      improvements: improvements || [],
      fixes: fixes || [],
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
  })

  await logAdminAction(
    admin,
    'changelog.create',
    'changelog_entry',
    entry.id,
    `Created changelog entry: ${entry.title}`,
    { version, title },
    request
  )

  return NextResponse.json({ entry }, { status: 201 })
}

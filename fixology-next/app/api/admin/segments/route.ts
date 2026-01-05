import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const segments = await prisma.segment.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ segments })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'segment.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { name, rules } = body || {}

  if (!name || !rules) {
    return NextResponse.json({ error: 'name and rules are required' }, { status: 400 })
  }

  const segment = await prisma.segment.create({
    data: {
      name,
      rules,
    },
  })

  await logAdminAction(
    admin,
    'segment.create',
    'segment',
    segment.id,
    `Created segment: ${segment.name}`,
    { name },
    request
  )

  return NextResponse.json({ segment }, { status: 201 })
}

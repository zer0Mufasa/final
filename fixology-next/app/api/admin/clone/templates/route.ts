import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await prisma.shopTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ templates })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'template.create')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { name, description, category, config, isDefault } = body || {}

  if (!name || !config) {
    return NextResponse.json({ error: 'name and config are required' }, { status: 400 })
  }

  const template = await prisma.shopTemplate.create({
    data: {
      name,
      description,
      category,
      config,
      isDefault: isDefault || false,
      createdById: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'template.create',
    'template',
    template.id,
    `Created shop template: ${template.name}`,
    { name, category },
    request
  )

  return NextResponse.json({ template }, { status: 201 })
}

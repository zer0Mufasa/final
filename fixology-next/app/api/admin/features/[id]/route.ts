import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const flag = await prisma.featureFlag.findUnique({
    where: { id: params.id },
  })

  if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

  return NextResponse.json({ flag })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'feature.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const data: any = {}
  if (typeof body?.name === 'string') data.name = body.name.trim()
  if (typeof body?.description === 'string') data.description = body.description.trim()
  if (typeof body?.isActive === 'boolean') data.isActive = body.isActive
  if (body?.metadata && typeof body.metadata === 'object') data.metadata = body.metadata

  const oldFlag = await prisma.featureFlag.findUnique({ where: { id: params.id } })
  if (!oldFlag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

  const flag = await prisma.featureFlag.update({
    where: { id: params.id },
    data,
  })

  await logAdminAction(
    admin,
    'feature.update',
    'feature_flag',
    flag.id,
    `Updated feature flag: ${flag.name} (${flag.key})`,
    { oldData: oldFlag, newData: data },
    request
  )

  return NextResponse.json({ flag })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'feature.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const flag = await prisma.featureFlag.findUnique({ where: { id: params.id } })
  if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })

  await prisma.featureFlag.delete({
    where: { id: params.id },
  })

  await logAdminAction(
    admin,
    'feature.delete',
    'feature_flag',
    flag.id,
    `Deleted feature flag: ${flag.name} (${flag.key})`,
    {},
    request
  )

  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'shop.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { tagId } = body || {}

  if (!tagId) {
    return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
  }

  // Check if assignment already exists
  const existing = await prisma.shopTagAssignment.findUnique({
    where: {
      shopId_tagId: {
        shopId: params.id,
        tagId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Tag already assigned' }, { status: 400 })
  }

  const assignment = await prisma.shopTagAssignment.create({
    data: {
      shopId: params.id,
      tagId,
    },
    include: {
      tag: true,
      shop: { select: { name: true } },
    },
  })

  await logAdminAction(
    admin,
    'shop.tag',
    'shop',
    params.id,
    `Added tag ${assignment.tag.name} to shop ${assignment.shop.name}`,
    { tagId },
    request
  )

  return NextResponse.json({ assignment }, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: { id: string; tagId: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'shop.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  await prisma.shopTagAssignment.delete({
    where: {
      shopId_tagId: {
        shopId: params.id,
        tagId: params.tagId,
      },
    },
  })

  await logAdminAction(
    admin,
    'shop.untag',
    'shop',
    params.id,
    `Removed tag from shop`,
    { tagId: params.tagId },
    request
  )

  return NextResponse.json({ success: true })
}

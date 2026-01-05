import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import bcrypt from 'bcryptjs'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.shopUser.findUnique({
    where: { id: params.id },
    include: {
      shop: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      shop: user.shop,
    },
  })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'user.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const data: any = {}
  if (typeof body?.name === 'string') data.name = body.name.trim()
  if (typeof body?.email === 'string') data.email = body.email.trim()
  if (typeof body?.phone === 'string') data.phone = body.phone.trim()
  if (typeof body?.role === 'string') data.role = body.role
  if (typeof body?.status === 'string') data.status = body.status

  const oldUser = await prisma.shopUser.findUnique({ where: { id: params.id } })
  if (!oldUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const user = await prisma.shopUser.update({
    where: { id: params.id },
    data,
  })

  await logAdminAction(
    admin,
    'user.update',
    'user',
    user.id,
    `Updated user: ${user.email}`,
    { oldData: oldUser, newData: data },
    request
  )

  return NextResponse.json({ user })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'user.delete')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const user = await prisma.shopUser.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.shopUser.update({
    where: { id: params.id },
    data: { status: 'INACTIVE' }, // Soft delete
  })

  await logAdminAction(
    admin,
    'user.delete',
    'user',
    user.id,
    `Soft-deleted user: ${user.email}`,
    {},
    request
  )

  return NextResponse.json({ success: true })
}

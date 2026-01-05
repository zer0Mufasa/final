import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role, isActive } = await request.json()

  const updateData: any = {}
  if (role) updateData.role = role
  // Note: PlatformAdmin doesn't have isActive field, you'd need to add it or use a different approach

  const updatedAdmin = await prisma.platformAdmin.update({
    where: { id: params.id },
    data: updateData,
  })

  await logAdminAction(
    admin,
    'admin.update',
    'platform_admin',
    params.id,
    `Updated admin: ${updatedAdmin.email}`,
    { adminId: params.id, changes: { role, isActive } },
    request
  )

  return NextResponse.json({ admin: updatedAdmin })
}

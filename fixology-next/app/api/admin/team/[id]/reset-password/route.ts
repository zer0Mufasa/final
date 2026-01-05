import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import bcrypt from 'bcryptjs'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const targetAdmin = await prisma.platformAdmin.findUnique({ where: { id: params.id } })
  if (!targetAdmin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  // Generate new password
  const newPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!'
  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.platformAdmin.update({
    where: { id: params.id },
    data: { passwordHash },
  })

  await logAdminAction(
    admin,
    'admin.reset_password',
    'platform_admin',
    params.id,
    `Reset password for admin: ${targetAdmin.email}`,
    { adminId: params.id },
    request
  )

  // TODO: Send email with new password
  // For now, return it (in production, send via email)
  return NextResponse.json({
    password: newPassword, // Remove in production, send via email instead
  })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import bcrypt from 'bcryptjs'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'user.reset_password')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const newPassword = typeof body?.password === 'string' ? body.password.trim() : null

  // Generate random password if not provided
  const password = newPassword || Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.shopUser.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.shopUser.update({
    where: { id: params.id },
    data: { passwordHash },
  })

  await logAdminAction(
    admin,
    'user.reset_password',
    'user',
    user.id,
    `Password reset for user: ${user.email}`,
    { passwordProvided: !!newPassword },
    request
  )

  return NextResponse.json({
    success: true,
    password: newPassword ? undefined : password, // Only return generated password if admin didn't provide one
  })
}

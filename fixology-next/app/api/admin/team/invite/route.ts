import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, name, role } = await request.json()

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!'
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const newAdmin = await prisma.platformAdmin.create({
    data: {
      email,
      name,
      role: role || 'SUPPORT',
      passwordHash,
    },
  })

  await logAdminAction(
    admin,
    'admin.invite',
    'platform_admin',
    newAdmin.id,
    `Invited admin: ${email}`,
    { adminId: newAdmin.id, email, role },
    request
  )

  // TODO: Send email with temp password
  // For now, return it (in production, send via email)
  return NextResponse.json({
    admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name },
    tempPassword, // Remove in production, send via email instead
  })
}

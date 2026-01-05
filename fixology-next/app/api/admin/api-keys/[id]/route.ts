import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } })
  if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 })

  // Verify ownership
  if (key.createdById !== admin.id && admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  await prisma.apiKey.delete({ where: { id: params.id } })

  await logAdminAction(
    admin,
    'api_key.delete',
    'api_key',
    params.id,
    `Deleted API key: ${key.name}`,
    { keyId: params.id },
    request
  )

  return NextResponse.json({ success: true })
}

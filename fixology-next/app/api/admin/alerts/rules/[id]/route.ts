import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'alert.update')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { isActive } = body || {}

  const rule = await prisma.alertRule.findUnique({ where: { id: params.id } })
  if (!rule) return NextResponse.json({ error: 'Alert rule not found' }, { status: 404 })

  const updated = await prisma.alertRule.update({
    where: { id: params.id },
    data: { isActive: isActive !== undefined ? isActive : rule.isActive },
  })

  await logAdminAction(
    admin,
    'alert.update',
    'alert_rule',
    updated.id,
    `Updated alert rule: ${updated.name} (${updated.isActive ? 'activated' : 'deactivated'})`,
    { isActive: updated.isActive },
    request
  )

  return NextResponse.json({ rule: updated })
}

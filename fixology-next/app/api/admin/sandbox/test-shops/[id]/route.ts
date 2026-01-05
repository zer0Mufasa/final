import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findUnique({ where: { id: params.id } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  // Verify it's a test shop
  const isTestShop = (shop.features as any)?.isTestShop
  if (!isTestShop) {
    return NextResponse.json({ error: 'Can only delete test shops' }, { status: 403 })
  }

  await prisma.shop.delete({ where: { id: params.id } })

  await logAdminAction(
    admin,
    'shop.delete_test',
    'shop',
    params.id,
    `Deleted test shop: ${shop.name}`,
    { shopId: params.id },
    request
  )

  return NextResponse.json({ success: true })
}

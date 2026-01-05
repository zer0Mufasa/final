import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { preset } = await request.json()

  // Generate fake shop data
  const shopName = `Test Shop ${Math.random().toString(36).substring(7)}`
  const shopSlug = shopName.toLowerCase().replace(/\s+/g, '-')

  const shop = await prisma.shop.create({
    data: {
      name: shopName,
      slug: shopSlug,
      email: `test-${Math.random().toString(36).substring(7)}@test.fixology.io`,
      plan: 'PRO',
      status: 'ACTIVE',
      features: {
        isTestShop: true,
        max_tickets: preset === 'full' ? 1000 : preset === 'basic' ? 100 : 25,
      },
    },
  })

  // Generate fake data based on preset
  if (preset === 'basic' || preset === 'full') {
    const ticketCount = preset === 'full' ? 100 : 10
    const customerCount = preset === 'full' ? 50 : 5

    // Create customers
    const customers = await Promise.all(
      Array.from({ length: customerCount }).map((_, i) =>
        prisma.customer.create({
          data: {
            shopId: shop.id,
            name: `Test Customer ${i + 1}`,
            email: `customer${i + 1}@test.com`,
            phone: `555-000-${String(i + 1).padStart(4, '0')}`,
          },
        })
      )
    )

    // Create tickets
    await Promise.all(
      Array.from({ length: ticketCount }).map((_, i) =>
        prisma.ticket.create({
          data: {
            shopId: shop.id,
            customerId: customers[i % customerCount].id,
            status: ['INTAKE', 'DIAGNOSED', 'WAITING', 'IN_PROGRESS', 'READY'][i % 5] as any,
            deviceType: ['iPhone', 'Samsung', 'iPad', 'MacBook'][i % 4],
            deviceModel: `Model ${i + 1}`,
            issue: `Test issue ${i + 1}`,
          },
        })
      )
    )

    if (preset === 'full') {
      // Create inventory items
      await Promise.all(
        Array.from({ length: 20 }).map((_, i) =>
          prisma.inventoryItem.create({
            data: {
              shopId: shop.id,
              name: `Test Part ${i + 1}`,
              sku: `TEST-${i + 1}`,
              quantity: Math.floor(Math.random() * 100),
              cost: Math.floor(Math.random() * 10000) / 100,
            },
          })
        )
      )
    }
  }

  await logAdminAction(
    admin,
    'shop.create_test',
    'shop',
    shop.id,
    `Created test shop: ${shop.name} (preset: ${preset})`,
    { shopId: shop.id, preset },
    request
  )

  return NextResponse.json({ shop })
}

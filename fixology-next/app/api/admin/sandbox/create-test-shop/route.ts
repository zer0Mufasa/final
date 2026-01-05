import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import type { Prisma, TicketStatus } from '@prisma/client'

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
      } as Prisma.InputJsonValue,
    },
  })

  // Create a shop owner user so tickets can reference createdById
  const owner = await prisma.shopUser.create({
    data: {
      shopId: shop.id,
      email: `owner-${Math.random().toString(36).substring(7)}@test.fixology.io`,
      passwordHash: 'test-only',
      name: 'Test Owner',
      role: 'OWNER',
      permissions: {} as Prisma.InputJsonValue,
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
            firstName: 'Test',
            lastName: `Customer ${i + 1}`,
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
            ticketNumber: `FIX-${String(i + 1).padStart(4, '0')}`,
            customerId: customers[i % customerCount].id,
            status: ['INTAKE', 'DIAGNOSED', 'WAITING_PARTS', 'IN_PROGRESS', 'READY'][i % 5] as TicketStatus,
            deviceType: ['iPhone', 'Android Phone', 'iPad', 'MacBook'][i % 4],
            deviceBrand: ['Apple', 'Samsung', 'Apple', 'Apple'][i % 4],
            deviceModel: `Model ${i + 1}`,
            issueDescription: `Test issue ${i + 1}`,
            createdById: owner.id,
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
              category: 'PARTS',
              sellPrice: String(Math.floor(Math.random() * 10000) / 100),
              costPrice: String(Math.floor(Math.random() * 5000) / 100),
              minStock: 0,
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

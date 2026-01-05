import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import type { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'shop.clone')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { sourceShopId, targetShopId, clonedFields } = body || {}

  if (!sourceShopId || !clonedFields || !Array.isArray(clonedFields)) {
    return NextResponse.json({ error: 'sourceShopId and clonedFields array are required' }, { status: 400 })
  }

  const sourceShop = await prisma.shop.findUnique({ where: { id: sourceShopId } })
  if (!sourceShop) return NextResponse.json({ error: 'Source shop not found' }, { status: 404 })

  let targetShopIdFinal = targetShopId

  // If cloning to new shop, create it
  if (!targetShopId) {
    const newShop = await prisma.shop.create({
      data: {
        name: `${sourceShop.name} (Clone)`,
        slug: `${sourceShop.slug}-clone-${Date.now()}`,
        email: `clone-${Date.now()}@example.com`, // Admin should update this
        plan: sourceShop.plan,
        status: 'TRIAL',
        features: clonedFields.includes('settings')
          ? (sourceShop.features as Prisma.InputJsonValue)
          : ({} as Prisma.InputJsonValue),
        // Copy other basic fields if settings is selected
        ...(clonedFields.includes('settings') && {
          phone: sourceShop.phone,
          address: sourceShop.address,
          city: sourceShop.city,
          state: sourceShop.state,
          zip: sourceShop.zip,
          country: sourceShop.country,
          timezone: sourceShop.timezone,
          currency: sourceShop.currency,
          logoUrl: sourceShop.logoUrl,
          businessHours: (sourceShop.businessHours ?? {}) as Prisma.InputJsonValue,
          repairFocus: sourceShop.repairFocus,
        }),
      },
    })
    targetShopIdFinal = newShop.id
  } else {
    // Clone to existing shop - update fields
    const targetShop = await prisma.shop.findUnique({ where: { id: targetShopId } })
    if (!targetShop) return NextResponse.json({ error: 'Target shop not found' }, { status: 404 })

    const updateData: any = {}
    if (clonedFields.includes('settings')) {
      updateData.features = sourceShop.features as Prisma.InputJsonValue
      updateData.phone = sourceShop.phone
      updateData.address = sourceShop.address
      updateData.city = sourceShop.city
      updateData.state = sourceShop.state
      updateData.zip = sourceShop.zip
      updateData.country = sourceShop.country
      updateData.timezone = sourceShop.timezone
      updateData.currency = sourceShop.currency
      updateData.businessHours = (sourceShop.businessHours ?? {}) as Prisma.InputJsonValue
      updateData.repairFocus = sourceShop.repairFocus
    }
    if (clonedFields.includes('branding')) {
      updateData.logoUrl = sourceShop.logoUrl
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.shop.update({
        where: { id: targetShopId },
        data: updateData,
      })
    }
  }

  // Clone workflows if selected
  if (clonedFields.includes('workflows')) {
    const sourceWorkflows = await prisma.workflow.findMany({
      where: { shopId: sourceShopId },
    })

    for (const workflow of sourceWorkflows) {
      await prisma.workflow.create({
        data: {
          shopId: targetShopIdFinal,
          name: workflow.name,
          description: workflow.description,
          isActive: workflow.isActive,
          trigger: (workflow.trigger ?? {}) as Prisma.InputJsonValue,
          actions: (workflow.actions ?? {}) as Prisma.InputJsonValue,
        },
      })
    }
  }

  // Clone inventory items if selected (reset quantity to 0)
  if (clonedFields.includes('inventoryCategories')) {
    const sourceInventory = await prisma.inventoryItem.findMany({
      where: { shopId: sourceShopId },
    })

    for (const item of sourceInventory) {
      await prisma.inventoryItem.create({
        data: {
          shopId: targetShopIdFinal,
          name: item.name,
          sku: item.sku ? `${item.sku}-clone` : null, // Modify SKU to avoid conflicts
          description: item.description,
          category: item.category,
          costPrice: item.costPrice,
          sellPrice: item.sellPrice,
          quantity: 0, // Reset quantity for cloned items
          minStock: item.minStock,
          maxStock: item.maxStock,
          location: item.location,
          brand: item.brand,
          model: item.model,
          imageUrl: item.imageUrl,
          isActive: item.isActive,
        },
      })
    }
  }

  // Clone user roles structure (create placeholder users with same roles)
  if (clonedFields.includes('userRoles')) {
    const sourceUsers = await prisma.shopUser.findMany({
      where: { shopId: sourceShopId },
      select: {
        name: true,
        role: true,
        permissions: true,
      },
    })

    // Create a structure document in features for reference
    // Don't create actual users, just document the structure
    const targetShop = await prisma.shop.findUnique({
      where: { id: targetShopIdFinal },
      select: { features: true },
    })

    if (targetShop) {
      const features = (targetShop.features || {}) as any
      features.clonedUserRoles = sourceUsers.map((u) => ({
        role: u.role,
        permissions: u.permissions,
      }))

      await prisma.shop.update({
        where: { id: targetShopIdFinal },
        data: { features },
      })
    }
  }

  // Clone custom fields (stored in features JSON)
  if (clonedFields.includes('customFields')) {
    const sourceShopFeatures = (sourceShop.features || {}) as any
    const targetShop = await prisma.shop.findUnique({
      where: { id: targetShopIdFinal },
      select: { features: true },
    })

    if (targetShop && sourceShopFeatures.customFields) {
      const features = (targetShop.features || {}) as any
      features.customFields = sourceShopFeatures.customFields

      await prisma.shop.update({
        where: { id: targetShopIdFinal },
        data: { features },
      })
    }
  }

  // Clone email templates (if stored in features)
  if (clonedFields.includes('emailTemplates')) {
    const sourceShopFeatures = (sourceShop.features || {}) as any
    const targetShop = await prisma.shop.findUnique({
      where: { id: targetShopIdFinal },
      select: { features: true },
    })

    if (targetShop && sourceShopFeatures.emailTemplates) {
      const features = (targetShop.features || {}) as any
      features.emailTemplates = sourceShopFeatures.emailTemplates

      await prisma.shop.update({
        where: { id: targetShopIdFinal },
        data: { features },
      })
    }
  }

  // Clone SMS templates (if stored in features)
  if (clonedFields.includes('smsTemplates')) {
    const sourceShopFeatures = (sourceShop.features || {}) as any
    const targetShop = await prisma.shop.findUnique({
      where: { id: targetShopIdFinal },
      select: { features: true },
    })

    if (targetShop && sourceShopFeatures.smsTemplates) {
      const features = (targetShop.features || {}) as any
      features.smsTemplates = sourceShopFeatures.smsTemplates

      await prisma.shop.update({
        where: { id: targetShopIdFinal },
        data: { features },
      })
    }
  }

  // Collect statistics about what was cloned
  const cloneStats: Record<string, number> = {}
  
  if (clonedFields.includes('workflows')) {
    const workflowCount = await prisma.workflow.count({
      where: { shopId: targetShopIdFinal },
    })
    cloneStats.workflows = workflowCount
  }
  
  if (clonedFields.includes('inventoryCategories')) {
    const inventoryCount = await prisma.inventoryItem.count({
      where: { shopId: targetShopIdFinal },
    })
    cloneStats.inventoryItems = inventoryCount
  }

  const cloneHistory = await prisma.cloneHistory.create({
    data: {
      sourceShopId,
      sourceType: 'shop',
      targetShopId: targetShopIdFinal,
      clonedFields,
      adminId: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'shop.clone',
    'shop',
    sourceShopId,
    `Cloned shop ${sourceShop.name} to ${targetShopId || 'new shop'}`,
    { clonedFields, targetShopId, stats: cloneStats },
    request
  )

  return NextResponse.json({
    success: true,
    cloneHistory,
    targetShopId: targetShopIdFinal,
    stats: cloneStats,
  }, { status: 201 })
}

// app/api/inventory/reorder-suggestions/route.ts
// Inventory reorder suggestions based on usage history

import { NextRequest, NextResponse } from 'next/server'
import { getShopContext, isContextError, isShopUser } from '@/lib/auth/get-shop-context'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  const context = await getShopContext()

  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status })
  }

  if (!isShopUser(context)) {
    return NextResponse.json({ error: 'Shop user required' }, { status: 403 })
  }

  try {
    const shopId = context.shopId
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all parts used in last 30 days
    const recentParts = await prisma.ticketPart.findMany({
      where: {
        ticket: {
          shopId,
          status: {
            in: ['READY', 'PICKED_UP'],
          },
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
      include: {
        inventory: true,
      },
    })

    // Calculate average daily usage per part
    const partUsage: Record<string, { total: number; currentStock: number; minStock: number; name: string }> = {}

    for (const ticketPart of recentParts) {
      const invId = ticketPart.inventoryId
      if (!partUsage[invId]) {
        partUsage[invId] = {
          total: 0,
          currentStock: ticketPart.inventory.quantity,
          minStock: ticketPart.inventory.minStock,
          name: ticketPart.inventory.name,
        }
      }
      partUsage[invId].total += ticketPart.quantity
    }

    // Calculate suggestions with AI intelligence
    const suggestions = Object.entries(partUsage).map(([inventoryId, data]) => {
      const avgDailyUsage = data.total / 30
      const projected30DayUsage = avgDailyUsage * 30
      
      // Calculate days until stockout
      const daysUntilStockout = data.currentStock > 0 
        ? Math.floor(data.currentStock / Math.max(avgDailyUsage, 0.1))
        : 0
      
      // Smart reorder calculation (add buffer for high-usage items)
      const buffer = avgDailyUsage > 1 ? Math.ceil(avgDailyUsage * 7) : 5 // 7-day buffer for high usage
      const suggestedReorder = Math.max(0, Math.ceil(projected30DayUsage - data.currentStock + buffer))
      const isLowStock = data.currentStock <= data.minStock
      const isCritical = daysUntilStockout <= 3

      // Detect duplicate SKUs by name similarity
      const similarItems = allInventory.filter(inv => 
        inv.id !== inventoryId &&
        inv.name.toLowerCase().includes(data.name.toLowerCase().split(' ')[0]) &&
        Math.abs(inv.sellPrice - (data as any).sellPrice) < 20 // Similar price
      )

      return {
        inventoryId,
        name: data.name,
        currentStock: data.currentStock,
        minStock: data.minStock,
        avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        projected30DayUsage: Math.ceil(projected30DayUsage),
        daysUntilStockout,
        suggestedReorder,
        isLowStock,
        isCritical,
        hasDuplicates: similarItems.length > 0,
        duplicateCount: similarItems.length,
        priority: isCritical ? 'HIGH' : isLowStock ? 'HIGH' : daysUntilStockout <= 7 ? 'MEDIUM' : 'LOW',
        alert: isCritical 
          ? `⚠️ Critical: Will run out in ${daysUntilStockout} day${daysUntilStockout !== 1 ? 's' : ''}`
          : isLowStock
          ? `⚠️ Low stock: Below minimum threshold`
          : daysUntilStockout <= 7
          ? `⚠️ Reorder soon: ${daysUntilStockout} days remaining`
          : null,
      }
    })

    // Sort by priority (low stock first, then by suggested reorder amount)
    suggestions.sort((a, b) => {
      if (a.isLowStock !== b.isLowStock) {
        return a.isLowStock ? -1 : 1
      }
      return b.suggestedReorder - a.suggestedReorder
    })

    // Get all low stock items (even if no recent usage)
    const allInventory = await prisma.inventoryItem.findMany({
      where: {
        shopId,
        isActive: true,
      },
    })

    const lowStockAlerts = allInventory
      .filter((inv) => inv.quantity <= inv.minStock)
      .filter((inv) => !suggestions.find((s) => s.inventoryId === inv.id))
      .map((inv) => ({
        inventoryId: inv.id,
        name: inv.name,
        currentStock: inv.quantity,
        minStock: inv.minStock,
        avgDailyUsage: 0,
        projected30DayUsage: 0,
        suggestedReorder: Math.max(0, inv.minStock - inv.quantity + 10), // Suggest min + buffer
        isLowStock: true,
        priority: 'HIGH' as const,
      }))

    return NextResponse.json({
      suggestions: [...suggestions, ...lowStockAlerts],
      summary: {
        totalItems: suggestions.length + lowStockAlerts.length,
        lowStockCount: suggestions.filter((s) => s.isLowStock).length + lowStockAlerts.length,
        highPriorityCount: suggestions.filter((s) => s.priority === 'HIGH').length + lowStockAlerts.length,
      },
    })
  } catch (error: any) {
    console.error('Reorder suggestions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate reorder suggestions' },
      { status: 500 }
    )
  }
}


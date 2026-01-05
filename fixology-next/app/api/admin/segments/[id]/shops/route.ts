import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const segment = await prisma.segment.findUnique({
    where: { id: params.id },
  })

  if (!segment) return NextResponse.json({ error: 'Segment not found' }, { status: 404 })

  const rules = segment.rules as any[]
  if (!Array.isArray(rules) || rules.length === 0) {
    return NextResponse.json({ shops: [], count: 0 })
  }

  // Build Prisma where clause from rules
  const where: any = {}

  for (const rule of rules) {
    const { field, operator, value } = rule

    switch (field) {
      case 'plan':
        if (operator === 'equals') {
          where.plan = value
        } else if (operator === 'in') {
          where.plan = { in: Array.isArray(value) ? value : [value] }
        }
        break

      case 'status':
        if (operator === 'equals') {
          where.status = value
        } else if (operator === 'in') {
          where.status = { in: Array.isArray(value) ? value : [value] }
        }
        break

      case 'mrr':
        if (operator === 'greater_than') {
          // MRR calculation based on plan
          const planMRR: Record<string, number> = {
            STARTER: 29,
            PRO: 79,
            ENTERPRISE: 199,
            FREE: 0,
          }
          const plans = Object.entries(planMRR)
            .filter(([_, mrr]) => mrr > value)
            .map(([plan]) => plan)
          if (plans.length > 0) {
            where.plan = { in: plans }
          } else {
            where.id = 'none' // No shops match
          }
        }
        break

      case 'created_after':
        if (operator === 'after') {
          where.createdAt = { gte: new Date(value) }
        }
        break

      case 'last_active':
        if (operator === 'within_days') {
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - value)
          where.users = {
            some: {
              lastLoginAt: { gte: daysAgo },
            },
          }
        }
        break

      case 'health_score':
        // Health score is calculated, so we'd need to fetch and filter
        // For now, skip this rule or implement health score calculation
        break

      case 'has_feature_flag':
        if (operator === 'equals') {
          // Check if shop has feature flag enabled
          // This would require checking FeatureFlag model
          break
        }
        break

      case 'has_tag':
        if (operator === 'includes') {
          where.tagAssignments = {
            some: {
              tag: {
                name: value,
              },
            },
          }
        }
        break
    }
  }

  const shops = await prisma.shop.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      status: true,
      createdAt: true,
    },
    take: 100, // Limit for performance
  })

  return NextResponse.json({ shops, count: shops.length })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { createAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

function planPriceDollars(plan: string) {
  switch (plan) {
    case 'STARTER':
      return 29
    case 'PRO':
      return 79
    case 'ENTERPRISE':
      return 199
    default:
      return 0
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function healthScoreFrom(lastActiveAt: Date | null, status: string) {
  if (status === 'CANCELLED') return 0
  if (status === 'SUSPENDED') return 10
  if (!lastActiveAt) return 25
  const days = Math.floor((Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
  return clamp(100 - days * 3, 0, 100)
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const status = (searchParams.get('status') || '').trim()
  const plan = (searchParams.get('plan') || '').trim()
  const tab = (searchParams.get('tab') || '').trim() // All | Active | Trial | At-Risk | Suspended | Churned
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') || 25)))
  const sort = (searchParams.get('sort') || 'createdAt').trim()
  const dir = (searchParams.get('dir') || 'desc').trim().toLowerCase() === 'asc' ? 'asc' : 'desc'

  const createdFrom = searchParams.get('createdFrom')
  const createdTo = searchParams.get('createdTo')

  const where: any = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            {
              users: {
                some: {
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
    ...(plan ? { plan: plan as any } : {}),
    ...(createdFrom || createdTo
      ? {
          createdAt: {
            ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
            ...(createdTo ? { lte: new Date(createdTo) } : {}),
          },
        }
      : {}),
  }

  if (tab) {
    const t = tab.toLowerCase()
    if (t === 'active') where.status = 'ACTIVE'
    if (t === 'trial') where.status = 'TRIAL'
    if (t === 'suspended') where.status = 'SUSPENDED'
    if (t === 'churned') where.status = 'CANCELLED'
    // at-risk computed after fetch (needs lastActive/health); keep broad here
    if (t === 'at-risk') where.status = { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'SUSPENDED'] }
  }

  const total = await prisma.shop.count({ where })

  const orderBy: any =
    sort === 'name'
      ? { name: dir }
      : sort === 'status'
        ? { status: dir }
        : sort === 'plan'
          ? { plan: dir }
          : { createdAt: dir }

  const shops = await prisma.shop.findMany({
    where,
    orderBy,
    include: {
      users: { where: { role: 'OWNER' }, take: 1 },
      _count: { select: { users: true, tickets: true, customers: true } },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const ids = shops.map((s) => s.id)
  const lastLogins = await prisma.shopUser.groupBy({
    by: ['shopId'],
    where: { shopId: { in: ids }, lastLoginAt: { not: null } },
    _max: { lastLoginAt: true },
  })
  const lastLoginMap = new Map<string, Date>()
  for (const row of lastLogins) {
    const d = row._max.lastLoginAt
    if (d) lastLoginMap.set(row.shopId, d)
  }

  const enriched = shops.map((s) => {
    const owner = s.users[0] || null
    const lastActiveAt = lastLoginMap.get(s.id) || null
    const healthScore = healthScoreFrom(lastActiveAt, s.status)
    const mrr = planPriceDollars(s.plan)
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      plan: s.plan,
      mrr,
      healthScore,
      lastActiveAt: lastActiveAt?.toISOString() || null,
      createdAt: s.createdAt.toISOString(),
      owner: owner
        ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone || null }
        : null,
      counts: {
        users: s._count.users,
        tickets: s._count.tickets,
        customers: s._count.customers,
      },
    }
  })

  return NextResponse.json({ shops: enriched, page, pageSize, total })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const shopName = typeof body?.shopName === 'string' ? body.shopName.trim() : (typeof body?.name === 'string' ? body.name.trim() : '')
  const ownerName = typeof body?.ownerName === 'string' ? body.ownerName.trim() : ''
  const ownerEmail = typeof body?.ownerEmail === 'string' ? body.ownerEmail.trim() : (typeof body?.email === 'string' ? body.email.trim() : '')
  const ownerPhone = typeof body?.ownerPhone === 'string' ? body.ownerPhone.trim() : (typeof body?.phone === 'string' ? body.phone.trim() : '')
  const plan = typeof body?.plan === 'string' ? body.plan : 'FREE'
  const trialDays = Number.isFinite(Number(body?.trialDays)) ? Number(body?.trialDays) : 14
  const sendWelcomeEmail = !!body?.sendWelcomeEmail
  const skipEmailVerification = !!body?.skipEmailVerification

  if (!shopName || !ownerName || !ownerEmail) {
    return NextResponse.json({ error: 'shopName, ownerName, ownerEmail are required' }, { status: 400 })
  }

  const existing = await prisma.shopUser.findFirst({ where: { email: ownerEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Owner email already exists' }, { status: 409 })
  }

  const baseSlug = shopName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let slug = baseSlug || `shop-${Math.random().toString(16).slice(2, 8)}`
  let counter = 1
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  // Create a random initial password (dev can show; prod should email a reset link).
  const tempPassword = `fx-${Math.random().toString(36).slice(2, 10)}A1!`
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const trialEndsAt = new Date(Date.now() + Math.max(1, trialDays) * 24 * 60 * 60 * 1000)

  const created = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: shopName,
        slug,
        email: ownerEmail,
        phone: ownerPhone || null,
        status: 'TRIAL',
        plan: plan as any,
        trialEndsAt,
      },
    })

    const owner = await tx.shopUser.create({
      data: {
        shopId: shop.id,
        email: ownerEmail,
        passwordHash,
        name: ownerName,
        role: 'OWNER',
        phone: ownerPhone || null,
        status: 'ACTIVE',
      },
    })

    return { shop, owner }
  })

  // Best-effort: create matching Supabase auth user (required for production shop login)
  let supabaseUserCreated = false
  let welcomeLink: string | null = null
  try {
    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: tempPassword,
      email_confirm: skipEmailVerification,
      user_metadata: { name: ownerName, shopId: created.shop.id, role: 'OWNER' },
    })
    if (!error && data?.user) {
      supabaseUserCreated = true
      if (sendWelcomeEmail) {
        const linkRes = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: ownerEmail,
        } as any)
        welcomeLink = (linkRes as any)?.data?.properties?.action_link || null
      }
    }
  } catch {
    // ok in dev; prod should set SUPABASE_SERVICE_ROLE_KEY
  }

  try {
    await logAdminAction({
      adminId: admin.id,
      action: 'shop.create',
      targetType: 'shop',
      targetId: created.shop.id,
      description: `Created shop: ${created.shop.name}`,
      metadata: { ownerEmail, plan, trialDays, supabaseUserCreated, sendWelcomeEmail },
      request,
    })
  } catch {}

  return NextResponse.json(
    {
      shop: { id: created.shop.id, name: created.shop.name, slug: created.shop.slug, status: created.shop.status, plan: created.shop.plan },
      owner: { id: created.owner.id, name: created.owner.name, email: created.owner.email, phone: created.owner.phone },
      dev: process.env.NODE_ENV !== 'production' ? { tempPassword, welcomeLink } : undefined,
    },
    { status: 201 }
  )
}


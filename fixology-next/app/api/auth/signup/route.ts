// app/api/auth/signup/route.ts
// API route to create a new shop and owner

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

// Generate a URL-safe slug from shop name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Ensure slug is unique by appending numbers if needed
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.shop.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopName, ownerName, email, phone, password } = body

    // Validate input
    if (!shopName || !ownerName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email is already used
    const existingUser = await prisma.shopUser.findFirst({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const baseSlug = generateSlug(shopName)
    const slug = await ensureUniqueSlug(baseSlug)

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create shop and owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the shop
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          slug,
          email,
          phone,
          status: 'TRIAL',
          plan: 'FREE',
          trialEndsAt: addDays(new Date(), 14),
          features: {
            max_tickets: 25,
            max_users: 1,
            max_customers: 100,
            sms: false,
            ai: true,
            workflows: false,
          },
        },
      })

      // Create the shop owner
      const owner = await tx.shopUser.create({
        data: {
          shopId: shop.id,
          email,
          passwordHash,
          name: ownerName,
          role: 'OWNER',
          phone,
          status: 'ACTIVE',
        },
      })

      return { shop, owner }
    })

    return NextResponse.json(
      {
        success: true,
        shop: {
          id: result.shop.id,
          name: result.shop.name,
          slug: result.shop.slug,
        },
        user: {
          id: result.owner.id,
          name: result.owner.name,
          email: result.owner.email,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)

    const msg = String(error?.message || '')
    const isDbUnreachable =
      msg.includes('P1001') ||
      msg.includes("Can't reach database server") ||
      msg.toLowerCase().includes('prismaclientinitializationerror')

    return NextResponse.json(
      {
        error: isDbUnreachable
          ? 'Database is unreachable from the server. Check Vercel DATABASE_URL (Supabase pooler recommended).'
          : 'Failed to create account',
      },
      { status: 500 }
    )
  }
}


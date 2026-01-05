// app/api/auth/signup/route.ts
// API route to create a new shop and owner

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

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
    const secure = request.nextUrl.protocol === 'https:'

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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server missing SUPABASE_SERVICE_ROLE_KEY (required for signup). Add it in Vercel env vars.' },
        { status: 500 }
      )
    }

    // Generate unique slug
    const baseSlug = generateSlug(shopName)
    const slug = await ensureUniqueSlug(baseSlug)

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // 1) Create Supabase user WITHOUT sending confirmation email (auto-confirm)
    const admin = createAdminClient()
    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: ownerName,
        shop_name: shopName,
      },
    })

    if (createUserError) {
      // Common case: user already exists in Supabase auth but not in our DB.
      // Treat as "already registered" for now.
      return NextResponse.json(
        { error: createUserError.message || 'Failed to create auth user' },
        { status: 400 }
      )
    }

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

    // 3) Create a Supabase session cookie for immediate login
    let response = NextResponse.json(
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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options, secure })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options, secure })
          },
        },
      }
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // User is created + shop is created, but we couldn't auto-login.
      // Return success anyway and let them login manually.
      return NextResponse.json(
        { success: true, shop: { id: result.shop.id, name: result.shop.name, slug: result.shop.slug } },
        { status: 201 }
      )
    }

    return response
  } catch (error: any) {
    console.error('Signup error:', error)

    // Best-effort cleanup: if we created a Supabase user but failed later, try deleting it.
    // (We only have access to email here; ignore failures.)
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && typeof (error as any)?.email === 'string') {
        const admin = createAdminClient()
        const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
        // no-op: listUsers isn't efficient; skip cleanup without user id
      }
    } catch {}

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


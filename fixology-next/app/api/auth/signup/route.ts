// app/api/auth/signup/route.ts
// API route to create a new shop and owner

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { Prisma } from '@prisma/client'
import { sendWelcomeEmail } from '@/lib/email/send'

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

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error:
            'Server missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.',
        },
        { status: 500 }
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
      return NextResponse.json(
        {
          error:
            createUserError.message?.includes('already registered') ||
            createUserError.message?.toLowerCase().includes('user already') ||
            createUserError.status === 400
              ? 'Email already registered'
              : createUserError.message || 'Failed to create auth user',
        },
        { status: 400 }
      )
    }

    const supabaseUserId = createdUser?.user?.id

    // 2) Create shop + owner in a transaction (and cleanup auth user if DB fails)
    let result: { shop: any; owner: any }
    try {
      result = await prisma.$transaction(async (tx) => {
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
    } catch (dbError) {
      if (supabaseUserId) {
        try {
          await admin.auth.admin.deleteUser(supabaseUserId)
        } catch {
          // ignore cleanup errors
        }
      }
      throw dbError
    }

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
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options, secure })
            })
          },
        },
      }
    )

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // User is created + shop is created, but we couldn't auto-login.
      // Return success anyway and let them login manually.
      try {
        await sendWelcomeEmail(email, {
          shopName: result.shop.name,
          ownerName: ownerName,
          trialDays: 14,
          loginUrl: `${request.nextUrl.origin}/dashboard`,
        })
      } catch {
        // never block signup due to email failures
      }
      return NextResponse.json(
        { success: true, shop: { id: result.shop.id, name: result.shop.name, slug: result.shop.slug } },
        { status: 201 }
      )
    }

    // Best-effort: welcome email (does not block signup).
    try {
      await sendWelcomeEmail(email, {
        shopName: result.shop.name,
        ownerName: ownerName,
        trialDays: 14,
        loginUrl: `${request.nextUrl.origin}/dashboard`,
      })
    } catch {
      // never block signup due to email failures
    }

    return response
  } catch (error: any) {
    console.error('Signup error:', error)

    const msg = String(error?.message || '')
    const isDbUnreachable =
      msg.includes('P1001') ||
      msg.includes("Can't reach database server") ||
      msg.toLowerCase().includes('prismaclientinitializationerror')

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }

      if (error.code === 'P2022') {
        const missingColumn = (error.meta as any)?.column as string | undefined
        return NextResponse.json(
          {
            error: 'Database schema is out of date (missing column). Run migrations on the production DB.',
            detail: missingColumn ? `Missing column: ${missingColumn}` : 'Missing column (P2022)',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'Database error while creating account',
          detail: `${error.code}${(error.meta as any)?.column ? ` (${String((error.meta as any).column)})` : ''}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: isDbUnreachable
          ? 'Database is unreachable from the server. Check Vercel DATABASE_URL (Supabase pooler recommended).'
          : msg.includes('SUPABASE_SERVICE_ROLE_KEY')
            ? 'Server missing SUPABASE_SERVICE_ROLE_KEY (required for signup). Add it in Vercel env vars.'
            : msg.includes('NEXT_PUBLIC_SUPABASE_URL') || msg.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
              ? 'Server missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
              : 'Failed to create account',
        // Keep detail short; helps debugging in Vercel logs without dumping stack traces to users.
        detail: msg ? msg.slice(0, 180) : undefined,
      },
      { status: 500 }
    )
  }
}


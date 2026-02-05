// lib/auth/get-shop-context.ts
// Get the current user's shop context for API routes

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma/client'

export type ShopContext =
  | {
      type: 'platform_admin'
      admin: {
        id: string
        email: string
        name: string
        role: string
      }
      getShopId: (requestedShopId?: string) => string | undefined
    }
  | {
      type: 'shop_user'
      user: {
        id: string
        email: string
        name: string
        role: string
        shopId: string
      }
      shop: {
        id: string
        name: string
        slug: string
        status: string
        plan: string
        features: any
      }
      shopId: string
      getShopId: () => string
    }
  | {
      error: string
      status: number
    }

export async function getShopContext(request?: NextRequest): Promise<ShopContext> {
  // Always use cookies() from next/headers - it works in both Server Components and API Routes
  // The request parameter is kept for future use but we use the standard Next.js cookie API
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          } catch {
            // Ignore if called from a context where cookies are read-only.
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Unauthorized', status: 401 }
  }

  const email = session.user.email

  if (!email) {
    return { error: 'No email in session', status: 401 }
  }

  // Check if platform admin
  const platformAdmin = await prisma.platformAdmin.findUnique({
    where: { email },
  })

  if (platformAdmin) {
    return {
      type: 'platform_admin',
      admin: {
        id: platformAdmin.id,
        email: platformAdmin.email,
        name: platformAdmin.name,
        role: platformAdmin.role,
      },
      // Platform admins can access any shop via query param
      getShopId: (requestedShopId?: string) => requestedShopId,
    }
  }

  // Get shop user
  const shopUser = await prisma.shopUser.findFirst({
    where: {
      email,
      status: 'ACTIVE',
    },
    include: {
      shop: {
        // IMPORTANT: do NOT select every column (e.g. imei_credits) because prod DB can lag behind migrations.
        // Select only what we need for auth/context checks.
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          features: true,
        },
      },
    },
  })

  if (!shopUser) {
    return { error: 'No shop access', status: 403 }
  }

  if (shopUser.shop.status === 'CANCELLED' || shopUser.shop.status === 'SUSPENDED') {
    return { error: 'Shop inactive', status: 403 }
  }

  return {
    type: 'shop_user',
    user: {
      id: shopUser.id,
      email: shopUser.email,
      name: shopUser.name,
      role: shopUser.role,
      shopId: shopUser.shopId,
    },
    shop: {
      id: shopUser.shop.id,
      name: shopUser.shop.name,
      slug: shopUser.shop.slug,
      status: shopUser.shop.status,
      plan: shopUser.shop.plan,
      features: shopUser.shop.features,
    },
    shopId: shopUser.shopId,
    // Shop users can ONLY access their own shop
    getShopId: () => shopUser.shopId,
  }
}

// Helper to check if context has an error
export function isContextError(context: ShopContext): context is { error: string; status: number } {
  return 'error' in context
}

// Helper to check if context is a platform admin
export function isPlatformAdmin(
  context: ShopContext
): context is Extract<ShopContext, { type: 'platform_admin' }> {
  return 'type' in context && context.type === 'platform_admin'
}

// Helper to check if context is a shop user
export function isShopUser(
  context: ShopContext
): context is Extract<ShopContext, { type: 'shop_user' }> {
  return 'type' in context && context.type === 'shop_user'
}


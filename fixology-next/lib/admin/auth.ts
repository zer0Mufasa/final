import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma/client'

export type AdminClaims = {
  id: string
  email: string
  role: string
}

function requireSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev-friendly fallback so local admin can work without extra env wiring.
      return new TextEncoder().encode('dev-admin-jwt-secret-change-me')
    }
    throw new Error('ADMIN_JWT_SECRET is not set')
  }
  return new TextEncoder().encode(secret)
}

export async function signAdminToken(claims: AdminClaims): Promise<string> {
  const secret = requireSecret()
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<AdminClaims | null> {
  try {
    const secret = requireSecret()
    const { payload } = await jwtVerify(token, secret)
    const id = typeof payload.id === 'string' ? payload.id : null
    const email = typeof payload.email === 'string' ? payload.email : null
    const role = typeof payload.role === 'string' ? payload.role : null
    if (!id || !email || !role) return null
    return { id, email, role }
  } catch {
    return null
  }
}

export async function loginPlatformAdmin(email: string, password: string) {
  const admin = await prisma.platformAdmin.findUnique({
    where: { email },
  })

  if (!admin) return { error: 'Invalid credentials' as const }

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) return { error: 'Invalid credentials' as const }

  const token = await signAdminToken({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  })

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  }
}

export function getAdminFromRequest(request: Request): AdminClaims | null {
  const id = request.headers.get('x-admin-id')
  const role = request.headers.get('x-admin-role')
  // email isn't forwarded; it's in the token only
  if (!id || !role) return null
  return { id, email: '', role }
}

export function canPerformAction(role: string, action: string): boolean {
  // PlatformRole enum: SUPER_ADMIN, SUPPORT, BILLING
  const permissions: Record<string, string[]> = {
    SUPER_ADMIN: ['*'],
    SUPPORT: ['view', 'support', 'impersonate'],
    BILLING: ['view', 'billing'],
  }
  const allowed = permissions[role] || ['view']
  return allowed.includes('*') || allowed.includes(action) || allowed.includes('view')
}


import { jwtVerify } from 'jose'

type AdminPayload = {
  id: string
  email: string
  role: string
}

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      return new TextEncoder().encode('dev-admin-jwt-secret-change-me')
    }
    return null
  }
  return new TextEncoder().encode(secret)
}

export async function verifyAdminTokenEdge(token: string): Promise<AdminPayload | null> {
  try {
    const secret = getSecret()
    if (!secret) return null
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


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { createdById: admin.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ keys })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, permissions, rateLimit, expiresAt } = await request.json()

  // Generate API key
  const apiKey = `fix_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = await bcrypt.hash(apiKey, 12)
  const keyPrefix = apiKey.substring(0, 8)

  const key = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      permissions: permissions || [],
      rateLimit: rateLimit || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: admin.id,
    },
  })

  await logAdminAction(
    admin,
    'api_key.create',
    'api_key',
    key.id,
    `Created API key: ${name}`,
    { keyId: key.id, name },
    request
  )

  return NextResponse.json({ key: { ...key, key: apiKey } }) // Return full key only once
}

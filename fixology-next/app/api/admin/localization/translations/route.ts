import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const language = searchParams.get('language') || 'en'

  const translations = await prisma.translation.findMany({
    where: { language },
    orderBy: { key: 'asc' },
  })

  return NextResponse.json({ translations })
}

export async function PATCH(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, language, value } = await request.json()

  const translation = await prisma.translation.upsert({
    where: { key_language: { key, language } },
    update: { value, isComplete: !!value },
    create: {
      key,
      language,
      value,
      isComplete: !!value,
    },
  })

  return NextResponse.json({ translation })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get enabled languages from platform settings
  const setting = await prisma.platformSetting.findUnique({ where: { key: 'enabled_languages' } })
  const languages = (setting?.value as string[]) || ['en']

  return NextResponse.json({ languages })
}

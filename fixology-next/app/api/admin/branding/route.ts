import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  // Get branding settings
  const settings = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: ['platform_name', 'primary_color', 'secondary_color', 'logo_light', 'logo_dark', 'favicon', 'custom_css', 'email_header', 'email_footer'],
      },
    },
  })

  const branding: Record<string, any> = {}
  settings.forEach((setting) => {
    const key = setting.key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    branding[key] = setting.value
  })

  return NextResponse.json(branding)
}

export async function PATCH(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = (await request.json()) as Record<string, Prisma.InputJsonValue>

  // Update each setting
  const updates = Object.entries(data).map(([key, value]) => {
    const settingKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    return prisma.platformSetting.upsert({
      where: { key: settingKey },
      update: { value },
      create: { key: settingKey, value },
    })
  })

  await Promise.all(updates)

  return NextResponse.json({ success: true })
}

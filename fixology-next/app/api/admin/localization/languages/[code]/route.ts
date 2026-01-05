import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function PATCH(request: Request, { params }: { params: { code: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { enabled } = await request.json()

  // Get current enabled languages
  const setting = await prisma.platformSetting.upsert({
    where: { key: 'enabled_languages' },
    update: {},
    create: { key: 'enabled_languages', value: ['en'] },
  })

  const currentLanguages = (setting.value as string[]) || ['en']
  let updatedLanguages: string[]

  if (enabled) {
    updatedLanguages = currentLanguages.includes(params.code)
      ? currentLanguages
      : [...currentLanguages, params.code]
  } else {
    updatedLanguages = currentLanguages.filter((lang) => lang !== params.code)
  }

  await prisma.platformSetting.update({
    where: { key: 'enabled_languages' },
    data: { value: updatedLanguages },
  })

  return NextResponse.json({ languages: updatedLanguages })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get onboarding steps from platform settings
  const stepsSetting = await prisma.platformSetting.findUnique({
    where: { key: 'onboarding_steps' },
  })

  const steps = (stepsSetting?.value as any[]) || []

  return NextResponse.json({ steps })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'onboarding.manage')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { title, description, order } = body || {}

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const stepsSetting = await prisma.platformSetting.findUnique({
    where: { key: 'onboarding_steps' },
  })

  const steps = (stepsSetting?.value as any[]) || []
  const newStep = {
    id: `step_${Date.now()}`,
    title,
    description: description || null,
    order: order !== undefined ? order : steps.length,
    createdAt: new Date().toISOString(),
  }

  steps.push(newStep)
  steps.sort((a, b) => (a.order || 0) - (b.order || 0))

  await prisma.platformSetting.upsert({
    where: { key: 'onboarding_steps' },
    update: { value: steps },
    create: {
      key: 'onboarding_steps',
      value: steps,
      description: 'Onboarding checklist steps',
    },
  })

  await logAdminAction(
    admin,
    'onboarding.step.create',
    'platform_setting',
    'onboarding_steps',
    `Created onboarding step: ${title}`,
    { title },
    request
  )

  return NextResponse.json({ step: newStep }, { status: 201 })
}

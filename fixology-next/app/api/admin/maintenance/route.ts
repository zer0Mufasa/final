import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check platform settings for maintenance mode
  const maintenanceSetting = await prisma.platformSetting.findUnique({
    where: { key: 'maintenance_mode' },
  })

  const maintenanceWindows = await prisma.maintenanceWindow.findMany({
    where: {
      status: { in: ['scheduled', 'active'] },
    },
    orderBy: { startAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    isActive: maintenanceSetting?.value === true || maintenanceWindows.some((w) => w.status === 'active'),
    currentWindow: maintenanceWindows.find((w) => w.status === 'active') || null,
    scheduledWindows: maintenanceWindows.filter((w) => w.status === 'scheduled'),
  })
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'maintenance.manage')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { action, title, message, startAt, endAt, allowedIps } = body || {}

  if (action === 'enable') {
    // Enable maintenance mode immediately
    await prisma.platformSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: true },
      create: {
        key: 'maintenance_mode',
        value: true,
        description: 'Platform maintenance mode',
      },
    })

    await logAdminAction(
      admin,
      'maintenance.enable',
      'platform_setting',
      'maintenance_mode',
      'Enabled maintenance mode',
      {},
      request
    )

    return NextResponse.json({ success: true, isActive: true })
  }

  if (action === 'disable') {
    await prisma.platformSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: false },
      create: {
        key: 'maintenance_mode',
        value: false,
        description: 'Platform maintenance mode',
      },
    })

    await logAdminAction(
      admin,
      'maintenance.disable',
      'platform_setting',
      'maintenance_mode',
      'Disabled maintenance mode',
      {},
      request
    )

    return NextResponse.json({ success: true, isActive: false })
  }

  if (action === 'schedule' && title && startAt) {
    const window = await prisma.maintenanceWindow.create({
      data: {
        title,
        message: message || null,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        allowedIps: allowedIps || [],
        status: 'scheduled',
        createdById: admin.id,
      },
    })

    await logAdminAction(
      admin,
      'maintenance.schedule',
      'maintenance_window',
      window.id,
      `Scheduled maintenance window: ${title}`,
      { title, startAt, endAt },
      request
    )

    return NextResponse.json({ window }, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

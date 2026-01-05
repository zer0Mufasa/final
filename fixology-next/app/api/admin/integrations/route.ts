import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAdminFromRequest } from '@/lib/admin/auth'

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const integrations = await prisma.integration.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Ensure default integrations exist
  const defaultServices = ['stripe', 'twilio', 'sendgrid', 'google']
  const existingServices = integrations.map((i) => i.service)

  for (const service of defaultServices) {
    if (!existingServices.includes(service)) {
      await prisma.integration.create({
        data: {
          service,
          config: {},
          status: 'unknown',
        },
      })
    }
  }

  const allIntegrations = await prisma.integration.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ integrations: allIntegrations })
}

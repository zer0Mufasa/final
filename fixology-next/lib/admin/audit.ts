import { prisma } from '@/lib/prisma/client'

export type AdminAuditInput = {
  adminId: string
  action: string
  targetType: string
  targetId?: string | null
  description?: string | null
  metadata?: any
  request?: Request
}

function getIp(request?: Request): string | null {
  if (!request) return null
  const xf = request.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim() || null
  const xr = request.headers.get('x-real-ip')
  if (xr) return xr.trim() || null
  return null
}

export async function logAdminAction(input: AdminAuditInput): Promise<any>
export async function logAdminAction(
  admin: { id: string },
  action: string,
  targetType: string,
  targetId?: string | null,
  description?: string | null,
  metadata?: any,
  request?: Request
): Promise<any>
export async function logAdminAction(
  arg1: AdminAuditInput | { id: string },
  action?: string,
  targetType?: string,
  targetId?: string | null,
  description?: string | null,
  metadata?: any,
  request?: Request
) {
  const input: AdminAuditInput =
    'adminId' in arg1
      ? arg1
      : {
          adminId: arg1.id,
          action: action || 'unknown',
          targetType: targetType || 'unknown',
          targetId: targetId ?? null,
          description: description ?? null,
          metadata,
          request,
        }

  const ipAddress = getIp(input.request)
  const userAgent = input.request?.headers.get('user-agent') || null

  return prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId || null,
      description: input.description || null,
      metadata: input.metadata ?? undefined,
      ipAddress,
      userAgent,
    },
  })
}


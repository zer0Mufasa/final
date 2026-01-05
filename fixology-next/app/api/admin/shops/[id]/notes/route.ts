import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { canPerformAction, getAdminFromRequest } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const notes = await prisma.shopNote.findMany({
      where: { shopId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { admin: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        shopId: n.shopId,
        admin: n.admin,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    })
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (msg.includes('shop_notes') || msg.includes('P2021')) {
      // Dev-friendly: don't break UI if migrations haven't been applied yet.
      return NextResponse.json(
        {
          notes: [],
          warning: 'Shop notes table missing. Run Prisma migrations to create shop_notes.',
        },
        { status: 200 }
      )
    }
    throw err
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canPerformAction(admin.role, 'support') && !canPerformAction(admin.role, '*')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const content = typeof body?.content === 'string' ? body.content.trim() : ''
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  try {
    const note = await prisma.shopNote.create({
      data: { shopId: params.id, adminId: admin.id, content },
      include: { admin: { select: { id: true, name: true, email: true } } },
    })

    try {
      await logAdminAction({
        adminId: admin.id,
        action: 'shop.note.create',
        targetType: 'shop',
        targetId: params.id,
        description: 'Added internal note',
        metadata: { noteId: note.id },
        request,
      })
    } catch {}

    return NextResponse.json(
      {
        note: {
          id: note.id,
          shopId: note.shopId,
          admin: note.admin,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (err: any) {
    const msg = String(err?.message || '')
    if (msg.includes('shop_notes') || msg.includes('P2021')) {
      return NextResponse.json(
        {
          error: 'Shop notes table missing. Run Prisma migrations to create shop_notes.',
          detail: msg,
        },
        { status: 500 }
      )
    }
    throw err
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const menu = await prisma.menuItem.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ menu })
}

export async function PUT(request: Request) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, label, priceYen, isActive } = body

  if (!id || !label || priceYen == null || typeof priceYen !== 'number') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      label,
      priceYen,
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    },
  })

  return NextResponse.json({ item })
}

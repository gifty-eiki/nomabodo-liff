import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET(request: Request) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const search = searchParams.get('search') || ''

  const where = search
    ? { displayName: { contains: search, mode: 'insensitive' as const } }
    : {}

  const [customers, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      include: {
        subscription: true,
        visitSessions: {
          where: { checkedOutAt: null },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.profile.count({ where }),
  ])

  return NextResponse.json({ customers, total, page, limit })
}

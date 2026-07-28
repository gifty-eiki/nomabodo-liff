import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const plans = await prisma.pricePlan.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ plans })
}

export async function PUT(request: Request) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, label, maxMinutes, amountYen } = body

  // maxMinutes は null（フリー）を許容。それ以外は数値必須。
  if (!id || !label || amountYen == null) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (maxMinutes !== null && typeof maxMinutes !== 'number') {
    return NextResponse.json({ error: 'Invalid maxMinutes' }, { status: 400 })
  }

  const plan = await prisma.pricePlan.update({
    where: { id },
    data: { label, maxMinutes, amountYen },
  })

  return NextResponse.json({ plan })
}

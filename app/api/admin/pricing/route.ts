import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configs = await prisma.pricingConfig.findMany({
    orderBy: { appliesTo: 'asc' },
  })
  return NextResponse.json({ configs })
}

export async function PUT(request: Request) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, label, intervalMinutes, amountYen } = body

  if (!id || !label || intervalMinutes == null || amountYen == null) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const config = await prisma.pricingConfig.update({
    where: { id },
    data: { label, intervalMinutes, amountYen },
  })

  return NextResponse.json({ config })
}

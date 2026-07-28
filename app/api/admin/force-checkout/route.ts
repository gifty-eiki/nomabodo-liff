import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { getPlanCost } from '@/lib/billing'
import { getWeekendHolidaySurcharge } from '@/lib/holidays'

export async function POST(request: Request) {
  const adminId = await getAdminSession()
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await request.json()
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  const session = await prisma.visitSession.findUnique({
    where: { id: sessionId },
    include: {
      profile: { include: { subscription: true } },
    },
  })

  if (!session || session.checkedOutAt) {
    return NextResponse.json(
      { error: 'Session not found or already checked out' },
      { status: 404 }
    )
  }

  const now = new Date()
  const durationMinutes = Math.max(
    1,
    Math.floor((now.getTime() - session.checkedInAt.getTime()) / 60000)
  )

  const isSubscriber = session.profile.subscription?.status === 'active'
  const plans = await prisma.pricePlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { label: true, maxMinutes: true, amountYen: true },
  })
  const weekendSurcharge = getWeekendHolidaySurcharge(session.checkedInAt, isSubscriber)
  const amountYen =
    getPlanCost(durationMinutes, isSubscriber, plans, session.profile.isStudent) + weekendSurcharge

  const updated = await prisma.visitSession.update({
    where: { id: sessionId },
    data: {
      checkedOutAt: now,
      durationMinutes,
      amountYen,
      billingType: isSubscriber ? 'subscription' : 'pay_per_use',
    },
  })

  return NextResponse.json({ session: updated })
}

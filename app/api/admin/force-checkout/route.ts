import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'
import { getVisitCost } from '@/lib/billing'

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
  const configs = await prisma.pricingConfig.findMany({ where: { isActive: true } })
  const amountYen = getVisitCost(durationMinutes, isSubscriber, configs)

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

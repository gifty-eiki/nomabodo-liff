import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { getVisitCost } from '@/lib/billing'

export async function GET(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { lineUserId },
    include: { subscription: true },
  })
  if (!profile) {
    return NextResponse.json({ openSession: null, subscription: null })
  }

  const openSession = await prisma.visitSession.findFirst({
    where: { profileId: profile.id, checkedOutAt: null },
  })

  let openSessionData = null
  if (openSession) {
    const now = new Date()
    const durationMinutes = Math.max(
      1,
      Math.floor((now.getTime() - openSession.checkedInAt.getTime()) / 60000)
    )
    const isSubscriber = profile.subscription?.status === 'active'
    const configs = await prisma.pricingConfig.findMany({ where: { isActive: true } })
    const config = configs.find(
      (c) => c.appliesTo === (isSubscriber ? 'subscriber' : 'pay_per_use')
    )
    openSessionData = {
      id: openSession.id,
      checkedInAt: openSession.checkedInAt.toISOString(),
      estimatedCost: getVisitCost(durationMinutes, isSubscriber, configs),
      intervalMinutes: config?.intervalMinutes ?? 30,
      amountPerInterval: config?.amountYen ?? 500,
    }
  }

  const subscriptionData = profile.subscription
    ? {
        isActive: profile.subscription.status === 'active',
        planName: profile.subscription.planName,
        currentPeriodEnd:
          profile.subscription.currentPeriodEnd?.toISOString() ?? null,
      }
    : null

  return NextResponse.json({
    openSession: openSessionData,
    subscription: subscriptionData,
  })
}

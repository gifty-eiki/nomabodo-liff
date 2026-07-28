import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { getPlanCost, pickPlan } from '@/lib/billing'
import { getWeekendHolidaySurcharge } from '@/lib/holidays'

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
    return NextResponse.json({ openSession: null, subscription: null, surveyCompleted: false, playerName: null, currentOccupancy: 0 })
  }

  const [openSession, currentOccupancy] = await Promise.all([
    prisma.visitSession.findFirst({
      where: { profileId: profile.id, checkedOutAt: null },
    }),
    prisma.visitSession.count({ where: { checkedOutAt: null } }),
  ])

  let openSessionData = null
  if (openSession) {
    const now = new Date()
    const durationMinutes = Math.max(
      1,
      Math.floor((now.getTime() - openSession.checkedInAt.getTime()) / 60000)
    )
    const isSubscriber = profile.subscription?.status === 'active'
    const plans = await prisma.pricePlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { label: true, maxMinutes: true, amountYen: true },
    })
    // 土日祝の一律加算（入室日基準・会員は対象外・学割半額の対象外）
    const weekendSurcharge = getWeekendHolidaySurcharge(openSession.checkedInAt, isSubscriber)
    const currentPlan = isSubscriber ? null : pickPlan(durationMinutes, plans)
    openSessionData = {
      id: openSession.id,
      checkedInAt: openSession.checkedInAt.toISOString(),
      estimatedCost:
        getPlanCost(durationMinutes, isSubscriber, plans, profile.isStudent) +
        weekendSurcharge,
      plans,
      currentPlanLabel: isSubscriber ? '会員' : currentPlan?.label ?? null,
      isSubscriber,
      isStudent: profile.isStudent,
      weekendSurcharge,
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
    surveyCompleted: profile.surveyCompleted,
    playerName: profile.playerName,
    currentOccupancy,
  })
}

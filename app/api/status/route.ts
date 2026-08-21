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
    return NextResponse.json({ openSession: null, subscription: null, surveyCompleted: false, playerName: null, currentOccupancy: 0, menu: [] })
  }

  // 有効な追加メニュー（フード・ドリンク）
  const menu = await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, label: true, priceYen: true, kind: true },
  })

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
    // このセッションの注文（追加メニュー）
    const orderItems = await prisma.orderItem.findMany({
      where: { visitSessionId: openSession.id },
      include: { menuItem: true },
    })
    const orderTotal = orderItems.reduce(
      (sum, oi) => sum + oi.menuItem.priceYen * oi.quantity,
      0
    )
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
      order: orderItems.map((oi) => ({ menuItemId: oi.menuItemId, quantity: oi.quantity })),
      orderTotal,
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
    menu,
  })
}

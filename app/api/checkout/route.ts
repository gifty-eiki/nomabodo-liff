import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { getPlanCost } from '@/lib/billing'
import { getWeekendHolidaySurcharge } from '@/lib/holidays'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const session = await prisma.visitSession.findFirst({
    where: { profileId: profile.id, checkedOutAt: null },
  })
  if (!session) {
    return NextResponse.json(
      { error: 'チェックイン中のセッションがありません' },
      { status: 404 }
    )
  }

  const now = new Date()
  const durationMinutes = Math.max(
    1,
    Math.floor((now.getTime() - session.checkedInAt.getTime()) / 60000)
  )

  const isSubscriber =
    profile.subscription?.status === 'active' &&
    (profile.subscription.currentPeriodEnd == null ||
      profile.subscription.currentPeriodEnd > now)

  const plans = await prisma.pricePlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { label: true, maxMinutes: true, amountYen: true },
  })

  // 追加メニュー（フード・ドリンク）の注文合計。会員・学割・土日祝に関わらず実額を加算。
  const orderItems = await prisma.orderItem.findMany({
    where: { visitSessionId: session.id },
    include: { menuItem: true },
  })
  const orderTotal = orderItems.reduce(
    (sum, oi) => sum + oi.menuItem.priceYen * oi.quantity,
    0
  )

  // 土日祝の一律加算（入室日基準・会員は対象外・学割半額の対象外）
  const weekendSurcharge = getWeekendHolidaySurcharge(session.checkedInAt, isSubscriber)
  const amountYen =
    getPlanCost(durationMinutes, isSubscriber, plans, profile.isStudent) +
    weekendSurcharge +
    orderTotal
  const billingType = isSubscriber ? 'subscription' : 'pay_per_use'

  const updatedSession = await prisma.visitSession.update({
    where: { id: session.id },
    data: {
      checkedOutAt: now,
      durationMinutes,
      amountYen,
      billingType,
    },
  })

  // Stripeが未設定の場合は決済スキップ
  if (amountYen === 0 || !process.env.STRIPE_SECRET_KEY) {
    await prisma.payment.create({
      data: {
        profileId: profile.id,
        visitSessionId: updatedSession.id,
        amountYen,
        status: 'succeeded',
        paymentType: amountYen === 0 ? 'subscription' : 'one_time',
      },
    })
    return NextResponse.json({ session: updatedSession, stripeUrl: null })
  }

  // Stripeで顧客を作成または取得
  let stripeCustomerId = profile.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: profile.displayName ?? undefined,
      metadata: { lineUserId },
    })
    stripeCustomerId = customer.id
    await prisma.profile.update({
      where: { id: profile.id },
      data: { stripeCustomerId },
    })
  }

  const payment = await prisma.payment.create({
    data: {
      profileId: profile.id,
      visitSessionId: updatedSession.id,
      amountYen,
      status: 'pending',
      paymentType: 'one_time',
    },
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: { name: 'のまぼど 利用料金' },
          unit_amount: amountYen,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?payment_id=${payment.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    metadata: { paymentId: payment.id },
  })

  return NextResponse.json({
    session: updatedSession,
    stripeUrl: checkoutSession.url,
  })
}

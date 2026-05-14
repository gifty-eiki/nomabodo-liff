import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { getVisitCost } from '@/lib/billing'
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

  const configs = await prisma.pricingConfig.findMany({
    where: { isActive: true },
  })

  const amountYen = getVisitCost(durationMinutes, isSubscriber, configs)
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

  if (amountYen === 0) {
    await prisma.payment.create({
      data: {
        profileId: profile.id,
        visitSessionId: updatedSession.id,
        amountYen: 0,
        status: 'succeeded',
        paymentType: 'subscription',
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
